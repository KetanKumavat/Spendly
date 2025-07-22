import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        console.log("Frontend API - userId received:", userId);

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        const backendUrl = `${BACKEND_URL}/expenses?userId=${encodeURIComponent(
            userId
        )}`;

        const response = await fetch(backendUrl, {
            headers: {
                // Forward any authorization headers
                ...(request.headers.get("authorization") && {
                    Authorization: request.headers.get("authorization")!,
                }),
            },
        });

        if (!response.ok) {
            // If the endpoint doesn't exist yet, return empty array
            if (response.status === 404) {
                return NextResponse.json([]);
            }
            return NextResponse.json(
                { error: "Failed to fetch expenses" },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Expenses fetch error:", error);
        return NextResponse.json([]);
    }
}
