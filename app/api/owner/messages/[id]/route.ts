// Owner Message Thread Detail API
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

interface Sender {
  id: string;
  first_name: string;
  last_name: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: threadId } = await params;
    const supabase = await createClient();

    // Get contact ID for the current user
    const { data: contactData, error: contactError } = await supabase
      .from("contacts")
      .select("id, first_name, last_name")
      .eq("portal_user_id", user.id)
      .single();

    if (contactError || !contactData) {
      return NextResponse.json(
        { success: false, error: "Contact not found" },
        { status: 404 }
      );
    }

    // Fetch thread
    const { data: thread, error: threadError } = await supabase
      .from("message_threads")
      .select(`
        id,
        subject,
        status,
        related_type,
        related_id,
        related_title,
        participants
      `)
      .eq("id", threadId)
      .single();

    if (threadError || !thread) {
      return NextResponse.json(
        { success: false, error: "Thread not found" },
        { status: 404 }
      );
    }

    // Check if user is a participant
    if (!thread.participants?.includes(contactData.id)) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // Fetch messages
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select(`
        id,
        content,
        sender_id,
        created_at
      `)
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      throw messagesError;
    }

    // Get sender names
    const senderIds = [...new Set((messages || []).map((m: Message) => m.sender_id))];
    const { data: senders } = senderIds.length > 0
      ? await supabase
          .from("contacts")
          .select("id, first_name, last_name")
          .in("id", senderIds)
      : { data: [] };

    const senderMap = new Map(
      (senders || []).map((s: Sender) => [
        s.id,
        `${s.first_name} ${s.last_name}`,
      ])
    );

    const formattedThread = {
      id: thread.id,
      subject: thread.subject,
      status: thread.status,
      relatedType: thread.related_type,
      relatedId: thread.related_id,
      relatedTitle: thread.related_title,
      participants: thread.participants || [],
    };

    const formattedMessages = (messages || []).map((msg: Message) => ({
      id: msg.id,
      sender: senderMap.get(msg.sender_id) || "Unknown",
      senderRole: msg.sender_id === contactData.id ? "Owner" : "Management",
      content: msg.content,
      createdAt: msg.created_at,
      isOwner: msg.sender_id === contactData.id,
    }));

    // Mark messages as read
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("thread_id", threadId)
      .neq("sender_id", contactData.id)
      .eq("is_read", false);

    return NextResponse.json({
      success: true,
      data: {
        thread: formattedThread,
        messages: formattedMessages,
      },
    });
  } catch (error) {
    console.error("Error fetching message thread:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch message thread" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: threadId } = await params;
    const body = await request.json();
    const supabase = await createClient();

    // Get contact ID for the current user
    const { data: contactData, error: contactError } = await supabase
      .from("contacts")
      .select("id")
      .eq("portal_user_id", user.id)
      .single();

    if (contactError || !contactData) {
      return NextResponse.json(
        { success: false, error: "Contact not found" },
        { status: 404 }
      );
    }

    // Create message
    const { error: messageError } = await supabase
      .from("messages")
      .insert({
        thread_id: threadId,
        sender_id: contactData.id,
        content: body.content,
        is_read: false,
        created_at: new Date().toISOString(),
      });

    if (messageError) {
      throw messageError;
    }

    // Update thread last message
    await supabase
      .from("message_threads")
      .update({
        last_message: body.content,
        last_message_at: new Date().toISOString(),
      })
      .eq("id", threadId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send message" },
      { status: 500 }
    );
  }
}
