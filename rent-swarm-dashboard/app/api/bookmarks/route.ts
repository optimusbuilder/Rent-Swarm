
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import connectToDatabase from "@/lib/db";
import User from "@/lib/models/User";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions) as any;

    if (!session || !session.user || !session.user.email) {
        return NextResponse.json({ bookmarks: [] });
    }

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });
    return NextResponse.json({ bookmarks: user?.bookmarks || [] });
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions) as any;

    if (!session || !session.user || !session.user.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookmark, action } = await req.json(); // action: 'add' | 'remove'

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (action === "add") {
        // Check dupe
        const exists = user.bookmarks.some((b: any) => b.id === bookmark.id);
        if (!exists) {
            user.bookmarks.push(bookmark);
        }
    } else if (action === "remove") {
        user.bookmarks = user.bookmarks.filter((b: any) => b.id !== bookmark.id);
    }

    await user.save();
    return NextResponse.json({ bookmarks: user.bookmarks });
}
