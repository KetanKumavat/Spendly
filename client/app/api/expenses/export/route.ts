import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const format = searchParams.get("format") || "csv";

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        const authorization = request.headers.get("authorization");

        const backendUrl = `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
        }/expenses/export?userId=${encodeURIComponent(
            userId
        )}&format=${format}`;

        const response = await fetch(backendUrl, {
            method: "GET",
            headers: {
                ...(authorization && { Authorization: authorization }),
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json(
                { error: `Backend error: ${errorText}` },
                { status: response.status }
            );
        }

        const data = await response.arrayBuffer();
        const contentType = response.headers.get("content-type") || "text/csv";
        const contentDisposition = response.headers.get("content-disposition");

        const nextResponse = new NextResponse(data, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                ...(contentDisposition && {
                    "Content-Disposition": contentDisposition,
                }),
            },
        });

        return nextResponse;
    } catch (error) {
        console.error("Export API error:", error);
        return NextResponse.json(
            { error: "Failed to export data" },
            { status: 500 }
        );
    }
}
