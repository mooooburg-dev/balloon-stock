import puppeteer from 'puppeteer';
import * as XLSX from 'xlsx';

export interface BalloonProduct {
  name: string;
  price?: string;
  originalPrice?: string;
  imageUrl?: string;
  link?: string;
  category?: string;
  categoryCode?: string;
}

export interface CategoryInfo {
  code: string;
  name: string;
  totalPages?: number;
}

// 카테고리 정보 매핑
export const CATEGORIES: CategoryInfo[] = [
  { code: '048001', name: '고무풍선' },
  { code: '048002', name: '은박풍선' },
  { code: '048009', name: '풍선꽃다발/케이크' },
  { code: '048007', name: '은박풍선세트' },
  { code: '048006', name: '천장풍선세트' },
  { code: '048008', name: '벌룬가랜드' },
  { code: '048004', name: '풍선만들기' }
];

export async function getMaxPagesForCategory(page: any, categoryCode: string): Promise<number> {
  const url = `https://www.joyparty.co.kr/goods/goods_list.php?page=1&cateCd=${categoryCode}`;
  
  try {
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // 페이지네이션에서 최대 페이지 수 찾기
    const maxPages = await page.evaluate(() => {
      // 페이지 번호 링크들을 찾기
      const pageLinks = document.querySelectorAll('a[href*="page="]');
      let maxPage = 1;
      
      pageLinks.forEach((link) => {
        const href = link.getAttribute('href') || '';
        const pageMatch = href.match(/page=(\d+)/);
        if (pageMatch) {
          const pageNum = parseInt(pageMatch[1]);
          if (pageNum > maxPage) {
            maxPage = pageNum;
          }
        }
      });
      
      // 마지막 페이지 링크도 확인
      const lastPageLink = document.querySelector('a[href*="page="]:last-of-type');
      if (lastPageLink) {
        const href = lastPageLink.getAttribute('href') || '';
        const pageMatch = href.match(/page=(\d+)/);
        if (pageMatch) {
          const pageNum = parseInt(pageMatch[1]);
          if (pageNum > maxPage) {
            maxPage = pageNum;
          }
        }
      }
      
      return maxPage;
    });
    
    console.log(`카테고리 ${categoryCode} 최대 페이지: ${maxPages}`);
    return maxPages;
  } catch (error) {
    console.error(`카테고리 ${categoryCode} 페이지 수 확인 중 오류:`, error);
    return 1; // 기본값
  }
}

export async function scrapeSinglePage(page: any, pageNum: number, categoryCode: string): Promise<BalloonProduct[]> {
  const url = `https://www.joyparty.co.kr/goods/goods_list.php?page=${pageNum}&cateCd=${categoryCode}`;
  const categoryName = CATEGORIES.find(cat => cat.code === categoryCode)?.name || categoryCode;
  
  console.log(`카테고리 ${categoryName} 페이지 ${pageNum} 크롤링 중...`);
  
  // Navigate to the page
  await page.goto(url, { 
    waitUntil: 'networkidle2',
    timeout: 30000 
  });

  // 페이지가 완전히 로드될 때까지 대기
  await new Promise(resolve => setTimeout(resolve, 1500));

  // 상품 링크가 있는지 확인
  try {
    await page.waitForSelector('a[href*="goods_view.php"]', { timeout: 5000 });
  } catch (error) {
    console.log(`카테고리 ${categoryName} 페이지 ${pageNum}에서 상품을 찾을 수 없습니다.`);
    return [];
  }

  // Extract product information
  const products = await page.evaluate((categoryName, categoryCode) => {
    const productList: any[] = [];
    
    // goods_view.php 링크 찾기
    const productLinks = document.querySelectorAll('a[href*="goods_view.php"]');
    
    productLinks.forEach((link) => {
      const container = link.closest('li') || link.closest('div') || link.parentElement;
      
      if (!container) return;
      
      // 상품명 추출
      let productName = '';
      const textContent = link.textContent?.trim() || '';
      // 이미지만 있는 링크는 제외
      if (textContent && textContent.length > 0) {
        productName = textContent.replace(/[\d,]+원/g, '').replace(/\s+/g, ' ').trim();
      }
      
      // 상품명이 없거나 너무 짧으면 건너뛰기
      if (!productName || productName.length < 2) return;
      
      // 이미지 URL 추출
      let imageUrl = '';
      const img = container.querySelector('img') || link.querySelector('img');
      if (img) {
        imageUrl = img.getAttribute('src') || 
                  img.getAttribute('data-original') || 
                  img.getAttribute('data-src') || '';
        
        // URL 정리
        if (imageUrl && !imageUrl.startsWith('http')) {
          if (imageUrl.startsWith('//')) {
            imageUrl = 'https:' + imageUrl;
          } else if (imageUrl.startsWith('/')) {
            imageUrl = 'https://www.joyparty.co.kr' + imageUrl;
          } else if (imageUrl.startsWith('../')) {
            // ../를 제거하고 경로 정리
            imageUrl = 'https://www.joyparty.co.kr/goods/' + imageUrl.replace(/^\.\.\//, '');
          } else {
            imageUrl = 'https://www.joyparty.co.kr/' + imageUrl;
          }
        }
      }
      
      // 가격 추출
      const priceText = container.textContent || '';
      const priceMatches = priceText.match(/[\d,]+원/g);
      let price = '';
      let originalPrice = '';
      
      if (priceMatches && priceMatches.length > 0) {
        // 마지막 가격이 판매가, 그 전 가격이 원가
        if (priceMatches.length > 1) {
          originalPrice = priceMatches[priceMatches.length - 2];
          price = priceMatches[priceMatches.length - 1];
        } else {
          price = priceMatches[0];
        }
      }
      
      // 링크 URL 정리
      let productLink = link.getAttribute('href') || '';
      if (productLink && !productLink.startsWith('http')) {
        if (productLink.startsWith('//')) {
          productLink = 'https:' + productLink;
        } else if (productLink.startsWith('/')) {
          productLink = 'https://www.joyparty.co.kr' + productLink;
        } else if (productLink.startsWith('../')) {
          // ../goods/goods_view.php를 /goods/goods_view.php로 변환
          productLink = 'https://www.joyparty.co.kr' + productLink.replace(/^\.\./, '');
        } else {
          productLink = 'https://www.joyparty.co.kr/' + productLink;
        }
      }
      
      productList.push({
        name: productName,
        price: price,
        originalPrice: originalPrice,
        imageUrl: imageUrl,
        link: productLink,
        category: categoryName,
        categoryCode: categoryCode
      });
    });
    
    return productList;
  }, categoryName, categoryCode);

  console.log(`카테고리 ${categoryName} 페이지 ${pageNum}에서 ${products.length}개 상품 발견`);
  return products;
}

export async function scrapeByCategory(categoryCode: string, maxPages?: number): Promise<BalloonProduct[]> {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  try {
    const page = await browser.newPage();
    
    // Set a user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    const categoryName = CATEGORIES.find(cat => cat.code === categoryCode)?.name || categoryCode;
    console.log(`카테고리 ${categoryName} 크롤링 시작`);
    
    // 최대 페이지 수 확인 (제공되지 않은 경우)
    if (!maxPages) {
      maxPages = await getMaxPagesForCategory(page, categoryCode);
    }
    
    const allProducts: BalloonProduct[] = [];
    
    // Scrape all pages for this category
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        const products = await scrapeSinglePage(page, pageNum, categoryCode);
        allProducts.push(...products);
        
        // Add delay between pages
        if (pageNum < maxPages) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`카테고리 ${categoryName} 페이지 ${pageNum} 크롤링 중 오류:`, error);
      }
    }
    
    console.log(`카테고리 ${categoryName} 크롤링 완료: ${allProducts.length}개 상품`);
    return allProducts;
  } finally {
    await browser.close();
  }
}

export async function scrapeAllCategories(selectedCategories?: string[]): Promise<Map<string, BalloonProduct[]>> {
  const categoriesToScrape = selectedCategories ? 
    CATEGORIES.filter(cat => selectedCategories.includes(cat.code)) : 
    CATEGORIES;
    
  const resultMap = new Map<string, BalloonProduct[]>();
  
  console.log(`${categoriesToScrape.length}개 카테고리 크롤링 시작`);
  
  for (const category of categoriesToScrape) {
    try {
      const products = await scrapeByCategory(category.code);
      resultMap.set(category.code, products);
    } catch (error) {
      console.error(`카테고리 ${category.name} 크롤링 실패:`, error);
      resultMap.set(category.code, []);
    }
  }
  
  return resultMap;
}

export function createMultiCategoryExcelFile(categoryProductsMap: Map<string, BalloonProduct[]>): Buffer {
  // Create a new workbook
  const wb = XLSX.utils.book_new();
  
  // 전체 상품 수 계산
  let totalProducts = 0;
  categoryProductsMap.forEach(products => totalProducts += products.length);
  
  // 각 카테고리별로 워크시트 생성
  categoryProductsMap.forEach((products, categoryCode) => {
    const categoryName = CATEGORIES.find(cat => cat.code === categoryCode)?.name || categoryCode;
    
    if (products.length === 0) {
      console.log(`카테고리 ${categoryName}: 상품 없음, 시트 생성 건너뛰기`);
      return;
    }
    
    // 워크시트 데이터 생성
    const wsData = [
      ['번호', '상품명', '판매가격', '원가', '이미지 URL', '상품 링크'],
      ...products.map((p, index) => [
        index + 1,
        p.name, 
        p.price || '', 
        p.originalPrice || '',
        p.imageUrl || '', 
        p.link || ''
      ])
    ];
    
    // 워크시트 생성
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // 열 너비 설정
    ws['!cols'] = [
      { wch: 8 },   // 번호
      { wch: 50 },  // 상품명
      { wch: 15 },  // 판매가격
      { wch: 15 },  // 원가
      { wch: 80 },  // 이미지 URL
      { wch: 80 }   // 상품 링크
    ];
    
    // 워크북에 시트 추가 (시트명에 상품 수 포함)
    // 엑셀에서 사용할 수 없는 문자들을 제거
    const cleanCategoryName = categoryName.replace(/[:\\/\?\*\[\]]/g, '_');
    const sheetName = `${cleanCategoryName}(${products.length})`;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    console.log(`엑셀 시트 생성: ${sheetName}`);
  });
  
  // 요약 시트 생성
  const summaryData = [
    ['카테고리', '상품 수'],
    ...Array.from(categoryProductsMap.entries()).map(([categoryCode, products]) => [
      CATEGORIES.find(cat => cat.code === categoryCode)?.name || categoryCode,
      products.length
    ]),
    ['총합', totalProducts]
  ];
  
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  summaryWs['!cols'] = [{ wch: 20 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, '요약');
  
  // 버퍼로 변환
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return Buffer.from(buffer);
}

// 기존 함수들 (하위 호환성을 위해 유지)
export async function scrapeBalloonProducts(url: string, maxPages: number = 43): Promise<BalloonProduct[]> {
  // 기존 전체 크롤링 방식 (048 카테고리)
  const allProducts = await scrapeAllCategories();
  const result: BalloonProduct[] = [];
  
  allProducts.forEach(products => {
    result.push(...products);
  });
  
  return result;
}

export function createExcelFile(products: BalloonProduct[], filename: string = 'balloon_products.xlsx'): Buffer {
  const wb = XLSX.utils.book_new();
  
  const wsData = [
    ['번호', '상품명', '판매가격', '원가', '이미지 URL', '상품 링크', '카테고리'],
    ...products.map((p, index) => [
      index + 1,
      p.name, 
      p.price || '', 
      p.originalPrice || '',
      p.imageUrl || '', 
      p.link || '',
      p.category || ''
    ])
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  ws['!cols'] = [
    { wch: 8 },
    { wch: 50 },
    { wch: 15 },
    { wch: 15 },
    { wch: 80 },
    { wch: 80 },
    { wch: 20 }
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, 'All Products');
  
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return Buffer.from(buffer);
}