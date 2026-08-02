// Owner Messages API
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get contact ID for the current user
    const { data: contactData, error: contactError } = await supabase
      .from("contacts")
      .select("id, first_name, last_name")
      .eq("portal_user_id", user.id)
      .single();

    if (contactError || !contactData) {
      return NextResponse.json({ success: true, data: [] });
    }

    const contactId = contactData.id;

    // Fetch message threads where user is a participant
    const { data: threads, error: threadsError } = await supabase
      .from("message_threads")
      .select(`
        id,
        subject,
        status,
        related_type,
        related_id,
        related_title,
        participants,
        last_message,
        last_message_at,
        created_at
      `)
      .contains("participants", [contactId])
      .order("last_message_at", { ascending: false });

    if (threadsError) {
      throw threadsError;
    }

    // Get unread counts for each thread
    const threadIds = (threads || []).map((t) => t.id);
    const { data: unreadCounts } = threadIds.length > 0
      ? await supabase
          .from("messages")
          .select("thread_id, id")
          .in("thread_id", threadIds)
          .neq("sender_id", contactId)
          .eq("is_read", false)
      : { data: [] };

    const unreadMap = new Map();
    (unreadCounts || []).forEach((msg) => {
      unreadMap.set(msg.thread_id, (unreadMap.get(msg.thread_id) || 0) + 1);
    });

    const formattedThreads = (threads || []).map((thread) => ({
      id: thread.id,
      subject: thread.subject,
      lastMessage: thread.last_message,
      lastMessageAt: thread.last_message_at || thread.created_at,
      unreadCount: unreadMap.get(thread.id) || 0,
      status: thread.status,
      relatedType: thread.related_type,
      relatedId: thread.related_id,
      relatedTitle: thread.related_title,
      participants: thread.participants || [],
    }));

    return NextResponse.json({ success: true, data: formattedThreads });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
