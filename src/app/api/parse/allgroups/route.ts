import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { Group } from "lucide-react";

interface Group {
  number: number;
}

export async function GET() {
  try {
    const response = await fetch(
      "https://portal.novsu.ru/univer/timetable/spo",
    );
    const page = await response.text();
    const $ = cheerio.load(page);
    const allGroups = new Set<Group>();
    $("#npe_instance_125460_npe_content table a").each((index, element) => {
      const text = $(element).text().trim();
      const groupMatches = text.match(/\d{4}/g);

      if (groupMatches) {
        groupMatches.forEach((groupNumber) => {
          const gr: Group = { number: parseInt(groupNumber) };
          allGroups.add(gr);
        });
      }
    });
    const groups = Array.from(allGroups);
    return NextResponse.json(
      groups,
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
  }
}
