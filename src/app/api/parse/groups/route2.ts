import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { GroupData, Student } from "@/types/parse";


async function parseGroupDetails(groupNumber: string): Promise<GroupData | null> {
  try {
    const response = await fetch(`https://portal.novsu.ru/search/groups/i.2500/?page=search&grpname=${groupNumber}`);
    const page = await response.text();
    const $ = cheerio.load(page);

    // Парсим информацию о группе
    let yearReceipt = 0;
    let course = 0;
    let direction = '';
    let profile = '';
    let institution = '';
    let formTraining = '';

    $('#npe_instance_2500_npe_content ul li').each((index, element) => {
      const text = $(element).text().trim();
      
      if (text.includes('Год поступления:')) {
        const match = text.match(/Год поступления:\s*(\d+)/);
        yearReceipt = match ? parseInt(match[1]) : 0;
      } 
      else if (text.includes('Курс:')) {
        const match = text.match(/Курс:\s*(\d+)/);
        course = match ? parseInt(match[1]) : 0;
      }
      else if (text.includes('Направление (специальность):')) {
        direction = text.replace('Направление (специальность):', '').trim();
      }
      else if (text.includes('Профиль:')) {
        profile = text.replace('Профиль:', '').trim();
      }
      else if (text.includes('Институт:')) {
        institution = text.replace('Институт:', '').trim();
      }
      else if (text.includes('Форма обучения:')) {
        formTraining = text.replace('Форма обучения:', '').trim();
      }
    });

    // Парсим студентов
    const students: Student[] = [];
    
    $('#npe_instance_2500_npe_content table.viewtable tr').each((index, row) => {
      if (index === 0) return;
      
      const cells = $(row).find('td');
      
      if (cells.length >= 3) {
        const number = parseInt($(cells[0]).text().trim()) || index;
        const name = $(cells[1]).find('a').text().trim();
        const status = $(cells[2]).text().trim();
        
        const link = $(cells[1]).find('a').attr('href');
        const personId = link ? link.split('/').pop() || '' : '';
        
        students.push({
          number,
          name,
          status,
          personId
        });
      }
    });

    return {
      number: parseInt(groupNumber),
      countStudent: students.length,
      yearReceipt,
      course,
      direction,
      profile,
      institution,
      formTraining,
      students
    };
    
  } catch (error) {
    console.error(`Ошибка парсинга группы ${groupNumber}:`, error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const groups: GroupData[] = [];
    const typesLearning = ["spo", "ochn", "zaochn"];
    const allGroupNumbers = new Set<string>();

    // 1. Сначала собираем все номера групп
    for (const type of typesLearning) {
      try {
        const response = await fetch(`https://portal.novsu.ru/univer/timetable/${type}/`);
        const page = await response.text();
        const $ = cheerio.load(page);

        $("table.viewtable a").each((index, element) => {
          const text = $(element).text().trim();
          const groupMatches = text.match(/\d{4}/g);
          
          if (groupMatches) {
            groupMatches.forEach(groupNumber => {
              allGroupNumbers.add(groupNumber);
            });
          }
        });
        
      } catch (error) {
        console.error(`Ошибка при обработке типа ${type}:`, error);
      }
    }

    // 2. Парсим детали для каждой группы (с ограничением для теста)
    const groupNumbers = Array.from(allGroupNumbers); // Берем только 10 групп для теста
    
    for (const groupNumber of groupNumbers) {
      try {
        const groupData = await parseGroupDetails(groupNumber);
        if (groupData) {
          groups.push(groupData);
        }
        
        // Добавляем задержку между запросами
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Ошибка обработки группы ${groupNumber}:`, error);
      }
    }

    // 3. Сортируем по номеру группы
    const sortedGroups = groups.sort((a, b) => a.number - b.number);

    return NextResponse.json({
      success: true,
      count: sortedGroups.length,
      groups: sortedGroups,
    }, { status: 200 });
    
  } catch (error) {
    console.error("Общая ошибка:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}