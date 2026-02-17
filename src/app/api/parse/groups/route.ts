import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { promises as fs } from "fs";
import path from "path";

interface Student {
  number: number;
  name: string;
  status: string;
  personId: string;
}

interface GroupData {
  number: number;
  countStudent: number;
  yearReceipt: number;
  course: number;
  direction: string;
  profile: string;
  institution: string;
  formTraining: string;
  students: Student[];
}

interface CachedData {
  groups: GroupData[];
  timestamp: number;
  totalGroups: number;
  processedGroups: number;
}

// Конфигурация
const CONFIG = {
  CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 часа
  REQUEST_DELAY: 200, // Задержка между запросами в мс
  BATCH_SIZE: 5, // Количество параллельных запросов
  MAX_GROUPS_PER_RUN: 50, // Максимальное количество групп за один запуск
  TIMEOUT: 10000, // Таймаут запроса в мс
  RETRY_ATTEMPTS: 2, // Количество попыток повтора
} as const;

// Кеширование в памяти
let memoryCache: {
  data: CachedData;
  timestamp: number;
} | null = null;

// Файловое кеширование (опционально)
const CACHE_FILE = path.join(process.cwd(), '.cache', 'groups.json');

async function saveToCache(data: CachedData): Promise<void> {
  try {
    memoryCache = { data, timestamp: Date.now() };
    
    // Также сохраняем в файл для persistence
    await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
    await fs.writeFile(CACHE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.warn('Не удалось сохранить кеш:', error);
  }
}

async function loadFromCache(): Promise<CachedData | null> {
  try {
    // Проверяем кеш в памяти
    if (memoryCache && Date.now() - memoryCache.timestamp < CONFIG.CACHE_DURATION) {
      return memoryCache.data;
    }
    
    // Пробуем загрузить из файла
    const fileContent = await fs.readFile(CACHE_FILE, 'utf-8');
    const data = JSON.parse(fileContent) as CachedData;
    
    // Проверяем актуальность
    if (Date.now() - data.timestamp < CONFIG.CACHE_DURATION) {
      memoryCache = { data, timestamp: data.timestamp };
      return data;
    }
  } catch (error) {
    console.log(error);
  }
  
  return null;
}

async function fetchWithTimeout(url: string, timeout = CONFIG.TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function fetchWithRetry(url: string, attempts = CONFIG.RETRY_ATTEMPTS): Promise<Response> {
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetchWithTimeout(url);
      if (response.ok) return response;
      
      if (response.status === 404) {
        throw new Error(`Страница не найдена: ${url}`);
      }
      
      if (i < attempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    } catch (error) {
      if (i === attempts - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  
  throw new Error(`Не удалось загрузить после ${attempts} попыток: ${url}`);
}

async function parseGroupDetails(groupNumber: string): Promise<GroupData | null> {
  try {
    const response = await fetchWithRetry(
      `https://portal.novsu.ru/search/groups/i.2500/?page=search&grpname=${groupNumber}`
    );
    const page = await response.text();
    const $ = cheerio.load(page);

    // 1. Ищем заголовок группы (более гибко)
    const groupHeader = $('h3').filter((_, el) => 
      $(el).text().includes('Группа:')
    ).first();
    
    if (!groupHeader.length) {
      // Альтернативный поиск
      const altHeader = $('h3, h2, h1').filter((_, el) => 
        $(el).text().includes(groupNumber)
      ).first();
      
      if (!altHeader.length) {
        console.warn(`Группа ${groupNumber} не найдена на странице`);
        return null;
      }
    }

    // 2. Ищем блок с данными группы (более гибкий поиск)
    let contentBlock = $('#npe_instance_2500_npe_content');
    
    // Если не нашли по ID, ищем по классам или структуре
    if (!contentBlock.length) {
      contentBlock = $('.block_content.content, .block2, .col_element').first();
    }
    
    // Если всё ещё не нашли, используем весь body
    if (!contentBlock.length) {
      contentBlock = $('body');
    }

    // 3. Парсим информацию о группе (более надежный метод)
    const metadata: Record<string, string> = {};
    
    // Ищем список с информацией о группе
    const listElements = contentBlock.find('ul li, ol li, div:contains("Год поступления"), div:contains("Курс:")');
    
    listElements.each((index, element) => {
      const text = $(element).text().trim();
      
      // Разные возможные форматы
      if (text.includes('Год поступления')) {
        const match = text.match(/Год поступления[:\s]*(\d{4})/);
        metadata['Год поступления'] = match ? match[1] : '';
      } 
      else if (text.includes('Курс')) {
        const match = text.match(/Курс[:\s]*(\d+)/);
        metadata['Курс'] = match ? match[1] : '';
      }
      else if (text.includes('Направление') || text.includes('специальность')) {
        const cleanText = text.replace(/Направление\s*\(специальность\)[:\s]*/, '')
                             .replace(/Направление[:\s]*/, '')
                             .trim();
        metadata['Направление (специальность)'] = cleanText;
      }
      else if (text.includes('Профиль')) {
        metadata['Профиль'] = text.replace(/Профиль[:\s]*/, '').trim();
      }
      else if (text.includes('Институт')) {
        metadata['Институт'] = text.replace(/Институт[:\s]*/, '').trim();
      }
      else if (text.includes('Форма обучения')) {
        metadata['Форма обучения'] = text.replace(/Форма обучения[:\s]*/, '').trim();
      }
    });

    // 4. Парсим таблицу студентов (разные возможные таблицы)
    const students: Student[] = [];
    
    // Ищем все возможные таблицы с данными студентов
    const possibleTables = contentBlock.find('table.viewtable, table[class*="view"], table');
    
    possibleTables.each((tableIndex, table) => {
      // Проверяем, что это таблица студентов (есть нужные столбцы)
      const headers: string[] = [];
      $(table).find('th').each((_, th) => {
        headers.push($(th).text().trim().toLowerCase());
      });
      
      // Ищем таблицу с колонками: номер, ФИО, статус
      const hasStudentColumns = headers.some(h => 
        h.includes('№') || h.includes('п/п') || 
        h.includes('фио') || h.includes('фам')
      );
      
      if (!hasStudentColumns) return; // Пропускаем не те таблицы
      
      $(table).find('tr').each((rowIndex, row) => {
        if (rowIndex === 0) return; // Пропускаем заголовок
        
        const cells = $(row).find('td');
        if (cells.length >= 3) {
          // Номер
          const numberText = $(cells[0]).text().trim();
          const number = parseInt(numberText) || rowIndex;
          
          // ФИО (может быть в ссылке или просто текстом)
          let name = '';
          let personId = '';
          
          const nameCell = $(cells[1]);
          const link = nameCell.find('a');
          
          if (link.length) {
            name = link.text().trim();
            const href = link.attr('href') || '';
            personId = href.split('/').pop() || '';
          } else {
            name = nameCell.text().trim();
          }
          
          // Статус
          const status = $(cells[2]).text().trim();
          
          // Проверяем, что это действительно студент (есть имя)
          if (name && name.length > 2) {
            // Проверяем дубликаты
            const isDuplicate = students.some(s => 
              s.name === name || s.personId === personId
            );
            
            if (!isDuplicate) {
              students.push({ number, name, status, personId });
            }
          }
        }
      });
    });

    // 5. Если студентов не нашли в таблице, пробуем другие способы
    if (students.length === 0) {
      // Ищем в div'ах или других структурах
      contentBlock.find('div, span').each((_, el) => {
        const text = $(el).text().trim();
        // Паттерн: "1. Иванов Иван Иванович"
        const studentMatch = text.match(/^(\d+)\.\s+([А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+(?:\s+[А-ЯЁ][а-яё]+)?)/);
        if (studentMatch) {
          const number = parseInt(studentMatch[1]);
          const name = studentMatch[2];
          students.push({ 
            number, 
            name, 
            status: 'СТ', 
            personId: '' 
          });
        }
      });
    }

    // 6. Извлекаем данные с безопасными значениями по умолчанию
    const extractNumber = (text: string): number => {
      if (!text) return 0;
      const match = text.match(/\d+/);
      return match ? parseInt(match[0]) : 0;
    };

    // 7. Определяем курс по номеру группы (если не нашли в метаданных)
    let course = extractNumber(metadata['Курс'] || '');
    if (!course && groupNumber.length === 4) {
      // Пытаемся определить курс по номеру группы
      const firstDigit = groupNumber[0];
      const courseMap: Record<string, number> = {
        '5': 1, // 5xxx - 1 курс
        '4': 2, // 4xxx - 2 курс  
        '3': 3, // 3xxx - 3 курс
        '2': 4, // 2xxx - 4 курс
        '1': 5, // 1xxx - 5 курс
      };
      course = courseMap[firstDigit] || 0;
    }

    // 8. Пытаемся определить направление по контексту
    let direction = metadata['Направление (специальность)'] || '';
    if (!direction) {
      // Ищем в заголовках или тексте
      const possibleDirection = contentBlock.text().match(
        /09\.02\.07|09\.02\.06|40\.02\.01|38\.02\.01|\d{2}\.\d{2}\.\d{2}/
      );
      if (possibleDirection) {
        direction = possibleDirection[0];
      }
    }

    return {
      number: parseInt(groupNumber),
      countStudent: students.length,
      yearReceipt: extractNumber(metadata['Год поступления'] || ''),
      course,
      direction,
      profile: metadata['Профиль'] || '',
      institution: metadata['Институт'] || 'КОЛЛЕДЖ', // Значение по умолчанию
      formTraining: metadata['Форма обучения'] || 'очная',
      students
    };
    
  } catch (error) { 
    console.error(`Ошибка парсинга группы ${groupNumber}:`, error);
    return null;
  }
}

async function parseBatchGroups(groupNumbers: string[]): Promise<GroupData[]> {
  const results = await Promise.allSettled(
    groupNumbers.map(async (groupNumber) => {
      await new Promise(resolve => setTimeout(resolve, CONFIG.REQUEST_DELAY));
      return parseGroupDetails(groupNumber);
    })
  );
  
  return results
    .filter((result): result is PromiseFulfilledResult<GroupData | null> => 
      result.status === 'fulfilled' && result.value !== null
    )
    .map(result => result.value as GroupData);
}

async function collectGroupNumbers(): Promise<Set<string>> {
  const groupNumbers = new Set<string>();
  const typesLearning = ["spo", "ochn", "zaochn"];
  
  for (const type of typesLearning) {
    try {
      const response = await fetchWithRetry(`https://portal.novsu.ru/univer/timetable/${type}/`);
      const page = await response.text();
      const $ = cheerio.load(page);

      $("table.viewtable a").each((index, element) => {
        const text = $(element).text().trim();
        const groupMatches = text.match(/\d{4}/g);
        
        if (groupMatches) {
          groupMatches.forEach(groupNumber => {
            // Фильтруем только валидные номера групп
            const firstDigit = groupNumber[0];
            if (['2', '3', '4', '5', '6'].includes(firstDigit)) {
              groupNumbers.add(groupNumber);
            }
          });
        }
      });
      
    } catch (error) {
      console.error(`Ошибка при сборе групп типа ${type}:`, error);
    }
  }
  
  return groupNumbers;
}

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Проверяем кеш
    const cached = await loadFromCache();
    if (cached) {
      return NextResponse.json({
        success: true,
        cached: true,
        timestamp: cached.timestamp,
        parsedAt: new Date(cached.timestamp).toISOString(),
        duration: Date.now() - startTime,
        count: cached.groups.length,
        totalGroups: cached.totalGroups,
        processedGroups: cached.processedGroups,
        groups: cached.groups,
      }, { status: 200 });
    }

    console.log('Начинаем парсинг групп...');
    
    // 1. Собираем номера всех групп
    console.log('Собираем номера групп...');
    const allGroupNumbers = await collectGroupNumbers();
    const groupNumbers = Array.from(allGroupNumbers)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .slice(0, CONFIG.MAX_GROUPS_PER_RUN);
    
    console.log(`Найдено ${allGroupNumbers.size} групп, обрабатываем ${groupNumbers.length}`);
    
    // 2. Парсим группы батчами
    const groups: GroupData[] = [];
    const batchCount = Math.ceil(groupNumbers.length / CONFIG.BATCH_SIZE);
    
    for (let i = 0; i < batchCount; i++) {
      const startIdx = i * CONFIG.BATCH_SIZE;
      const endIdx = Math.min(startIdx + CONFIG.BATCH_SIZE, groupNumbers.length);
      const batch = groupNumbers.slice(startIdx, endIdx);
      
      console.log(`Парсинг батча ${i + 1}/${batchCount} (группы ${batch[0]}-${batch[batch.length - 1]})`);
      
      const batchResults = await parseBatchGroups(batch);
      groups.push(...batchResults);
      
      // Прогресс
      const progress = Math.round(((i + 1) / batchCount) * 100);
      console.log(`Прогресс: ${progress}% (${groups.length}/${groupNumbers.length} групп)`);
      
      // Делаем паузу между батчами
      if (i < batchCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // 3. Сортируем и фильтруем результаты
    const sortedGroups = groups
      .filter(group => group.countStudent > 0) // Убираем пустые группы
      .sort((a, b) => a.number - b.number);
    
    const timestamp = Date.now();
    const result: CachedData = {
      groups: sortedGroups,
      timestamp,
      totalGroups: allGroupNumbers.size,
      processedGroups: sortedGroups.length,
    };
    
    // 4. Сохраняем в кеш
    await saveToCache(result);
    
    const duration = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      cached: false,
      timestamp,
      parsedAt: new Date(timestamp).toISOString(),
      duration,
      durationFormatted: `${Math.floor(duration / 1000)} секунд`,
      count: sortedGroups.length,
      totalGroups: allGroupNumbers.size,
      processedGroups: sortedGroups.length,
      statistics: {
        byCourse: sortedGroups.reduce((acc, group) => {
          acc[group.course] = (acc[group.course] || 0) + 1;
          return acc;
        }, {} as Record<number, number>),
        byInstitution: sortedGroups.reduce((acc, group) => {
          acc[group.institution] = (acc[group.institution] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
      groups: sortedGroups,
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
      }
    });
    
  } catch (error) {
    console.error("Критическая ошибка при парсинге:", error);
    
    // Пробуем вернуть данные из кеша, даже если они устарели
    const cached = await loadFromCache();
    if (cached) {
      return NextResponse.json({
        success: false,
        error: "Ошибка при обновлении данных, возвращаем кешированные",
        cached: true,
        timestamp: cached.timestamp,
        parsedAt: new Date(cached.timestamp).toISOString(),
        count: cached.groups.length,
        groups: cached.groups,
      }, { status: 200 });
    }
    
    return NextResponse.json({ 
      success: false,
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: Date.now(),
      parsedAt: new Date().toISOString(),
    }, { status: 500 });
  }
}

// Дополнительный endpoint для очистки кеша
export async function DELETE() {
  try {
    memoryCache = null;
    await fs.unlink(CACHE_FILE).catch(() => {});
    
    return NextResponse.json({
      success: true,
      message: "Кеш очищен",
      timestamp: Date.now(),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error,
    }, { status: 500 });
  }
}