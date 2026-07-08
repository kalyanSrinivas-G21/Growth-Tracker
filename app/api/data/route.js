import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../../lib/auth";
import { loadData, saveData } from "../../../lib/drive";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  try {
    const { fileId, data } = await loadData(session.accessToken);
    return NextResponse.json({ fileId, data });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Could not reach Google Drive" },
      { status: 502 }
    );
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const body = await request.json();
  const { fileId, data } = body;
  if (!fileId || !data) {
    return NextResponse.json({ error: "Missing fileId or data" }, { status: 400 });
  }
  try {
    await saveData(session.accessToken, fileId, data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Could not save to Google Drive" },
      { status: 502 }
    );
  }
}
