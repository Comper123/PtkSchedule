import { NextRequest, NextResponse } from "next/server";
import * as cheerio from 'cheerio';

export async function GET(
    request: NextRequest,
    { params } : { params : Promise<{ id : string}> }
){
    try {
        const students: Array<{
            number: number;
            name: string;
            status: string;
            personId: string;
        }> = [];

        const { id } = await params;

        // Загружаем страницу
        const response = await fetch(`https://portal.novsu.ru/search/groups/i.2500/?page=search&grpname=${id}`);
        const page = await response.text();
        const $ = cheerio.load(page);
        
        // Парсим список учеников
        $('table.viewtable tr').each((index, row) => {
            // Пропускаем заголовок (первая строка)
            if (index === 0) return;
            
            const cells = $(row).find('td');
            
            if (cells.length >= 3) {
                // Извлекаем данные из ячеек
                const number = parseInt($(cells[0]).text().trim());
                const name = $(cells[1]).find('a').text().trim();
                const status = $(cells[2]).text().trim();
                
                // Извлекаем ID из ссылки
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

        return NextResponse.json({
            students: students
        })
    } catch (error) {
        return NextResponse.json(
            { error: error },
            { status: 404 }
        )
    }
} 