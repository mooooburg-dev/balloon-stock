import puppeteer from 'puppeteer';
import * as XLSX from 'xlsx';

export interface BalloonProduct {
  name: string;
  price?: string;
  originalPrice?: string;
  imageUrl?: string;
  link?: string;
}

export async function scrapeSinglePage(page: any, pageNum: number): Promise<BalloonProduct[]> {
  const url = `https://www.joyparty.co.kr/goods/goods_list.php?page=${pageNum}&cateCd=048`;
  
  console.log(`페이지 ${pageNum} 크롤링 중...`);
  
  // Navigate to the page
  await page.goto(url, { 
    waitUntil: 'networkidle2',
    timeout: 30000 
  });

  // 페이지가 완전히 로드될 때까지 대기
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 상품 링크가 있는지 확인
  try {
    await page.waitForSelector('a[href*="goods_view.php"]', { timeout: 5000 });
  } catch (error) {
    console.log(`페이지 ${pageNum}에서 상품을 찾을 수 없습니다.`);
    return [];
  }

  // Extract product information
  const products = await page.evaluate(() => {
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
        link: productLink
      });
    });
    
    return productList;
  });

  console.log(`페이지 ${pageNum}에서 ${products.length}개 상품 발견`);
  return products;
}

export async function scrapeBalloonProducts(url: string, maxPages: number = 43): Promise<BalloonProduct[]> {
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
    
    const allProducts: BalloonProduct[] = [];
    
    // Scrape all pages
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        const products = await scrapeSinglePage(page, pageNum);
        allProducts.push(...products);
        
        // Add delay between pages
        if (pageNum < maxPages) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`페이지 ${pageNum} 크롤링 중 오류:`, error);
      }
    }
    
    console.log(`총 ${allProducts.length}개 상품 크롤링 완료`);
    return allProducts;
  } finally {
    await browser.close();
  }
}

export function createExcelFile(products: BalloonProduct[], filename: string = 'balloon_products.xlsx'): Buffer {
  const wb = XLSX.utils.book_new();
  
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
  
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  ws['!cols'] = [
    { wch: 8 },
    { wch: 50 },
    { wch: 15 },
    { wch: 15 },
    { wch: 80 },
    { wch: 80 }
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, 'Balloon Products');
  
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  
  return Buffer.from(buffer);
}