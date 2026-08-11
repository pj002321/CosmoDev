import { sql } from "@/lib/db";

export type Inquiry = {
  id: number;
  senderId: string | null;
  senderName: string;
  senderEmail: string;
  title: string;
  content: string;
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
};

type Row = {
  id: number;
  sender_id: string | null;
  sender_name: string;
  sender_email: string;
  title: string;
  content: string;
  reply: string | null;
  replied_at: string | Date | null;
  created_at: string | Date;
};

function toInquiry(row: Row): Inquiry {
  return {
    id: row.id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderEmail: row.sender_email,
    title: row.title,
    content: row.content,
    reply: row.reply,
    repliedAt: row.replied_at ? new Date(row.replied_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function createInquiry(
  senderId: string | null,
  senderName: string,
  senderEmail: string,
  title: string,
  content: string
): Promise<Inquiry> {
  const rows = (await sql()`
    INSERT INTO inquiries (sender_id, sender_name, sender_email, title, content)
    VALUES (${senderId}, ${senderName}, ${senderEmail}, ${title}, ${content})
    RETURNING id, sender_id, sender_name, sender_email, title, content, reply, replied_at, created_at
  `) as Row[];
  return toInquiry(rows[0]);
}

export async function getInquiries(): Promise<Inquiry[]> {
  const rows = (await sql()`
    SELECT id, sender_id, sender_name, sender_email, title, content, reply, replied_at, created_at
    FROM inquiries ORDER BY created_at DESC
  `) as Row[];
  return rows.map(toInquiry);
}

export async function getInquiry(id: number): Promise<Inquiry | null> {
  const rows = (await sql()`
    SELECT id, sender_id, sender_name, sender_email, title, content, reply, replied_at, created_at
    FROM inquiries WHERE id = ${id}
  `) as Row[];
  return rows[0] ? toInquiry(rows[0]) : null;
}

export async function replyToInquiry(id: number, reply: string): Promise<void> {
  await sql()`
    UPDATE inquiries SET reply = ${reply}, replied_at = now() WHERE id = ${id}
  `;
}
