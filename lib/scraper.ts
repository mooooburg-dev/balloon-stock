import puppeteer from 'puppeteer';
import * as XLSX from 'xlsx';
import { config } from 'dotenv';

// 환경 변수 로드
config({ path: '.env.local' });

export interface BalloonProduct {
  name: string;
  price?: string;
  originalPrice?: string;
  imageUrl?: string;
  link?: string;
  category?: string;
  categoryCode?: string;
  site?: string;
}

export interface CategoryInfo {
  code: string;
  name: string;
  totalPages?: number;
  parentCategory?: string;
}

export interface SiteConfig {
  id: string;
  name: string;
  baseUrl: string;
  categories: CategoryInfo[];
  selectors: {
    productLinks: string;
    productName: string;
    productPrice: string;
    productImage: string;
    productContainer: string;
  };
}

// 사이트 설정 매핑
export const SITES: Record<string, SiteConfig> = {
  saeroevent: {
    id: 'saeroevent',
    name: '새로이벤트',
    baseUrl: 'https://www.saeroeventb2b.co.kr:10497',
    categories: [
      // 고무풍선 카테고리 - 실제 데이터 기반
      { code: '01010000', name: '원형풍선', parentCategory: '고무풍선' },
      { code: '01030000', name: '꼬리풍선', parentCategory: '고무풍선' },
      { code: '01040000', name: '요술풍선', parentCategory: '고무풍선' },
      { code: '01050000', name: '대형풍선', parentCategory: '고무풍선' },
      { code: '01060000', name: '인쇄된풍선', parentCategory: '고무풍선' },
      { code: '01110000', name: '모양풍선', parentCategory: '고무풍선' },
      { code: '01120000', name: '버블,기타', parentCategory: '고무풍선' },
      // 은박풍선 카테고리 - 실제 데이터 기반
      {
        code: '02010000',
        name: '버블.별.하트.원형.오브.사각.다이아',
        parentCategory: '은박풍선',
      },
      { code: '02020000', name: '커브.달.야자수', parentCategory: '은박풍선' },
      { code: '02030000', name: '숫자호일', parentCategory: '은박풍선' },
      { code: '02040000', name: '알파벳호일', parentCategory: '은박풍선' },
      { code: '02050000', name: '캐릭터라이선스', parentCategory: '은박풍선' },
      {
        code: '02060000',
        name: '생일.음표.식물.십자가',
        parentCategory: '은박풍선',
      },
      {
        code: '02070000',
        name: '스마일,사랑,스포츠',
        parentCategory: '은박풍선',
      },
      {
        code: '02080000',
        name: '첫돌.베이비.탈것,우주',
        parentCategory: '은박풍선',
      },
      {
        code: '02090000',
        name: '웨딩.기념일.땡큐.땡땡이',
        parentCategory: '은박풍선',
      },
      {
        code: '02100000',
        name: '축하.입학.졸업.쾌유',
        parentCategory: '은박풍선',
      },
      {
        code: '02110000',
        name: '동물.음식.곤충,자연',
        parentCategory: '은박풍선',
      },
      {
        code: '02130000',
        name: '산보.에어워커,멀티,에어룬즈',
        parentCategory: '은박풍선',
      },
      { code: '02140000', name: '시즌호일', parentCategory: '은박풍선' },
      { code: '02210000', name: '바람개비풍선', parentCategory: '은박풍선' },
    ],
    selectors: {
      productLinks: 'a[href*="m_goods_detail.php"]',
      productName: 'img',
      productPrice: '.price, .goods_price',
      productImage: 'img',
      productContainer: 'a[href*="m_goods_detail.php"]',
    },
  },
  joypartyb2b: {
    id: 'joypartyb2b',
    name: '조이파티 B2B',
    baseUrl: 'https://www.joypartyb2b.co.kr',
    categories: [
      // 고무풍선 서브카테고리 (총 11개)
      { code: '4020', name: '조이벌룬', parentCategory: '고무풍선' },
      { code: '4030', name: 'Sempertex 라운드', parentCategory: '고무풍선' },
      { code: '40e0', name: 'Sempertex 리플렉스', parentCategory: '고무풍선' },
      { code: '4040', name: 'Sempertex 프린팅', parentCategory: '고무풍선' },
      { code: '4050', name: 'Sempertex 요술', parentCategory: '고무풍선' },
      { code: '4060', name: 'Sempertex 링커', parentCategory: '고무풍선' },
      { code: '4070', name: 'Sempertex 하트', parentCategory: '고무풍선' },
      { code: '40f0', name: '터프텍스', parentCategory: '고무풍선' },
      {
        code: '4090',
        name: '티벌룬/컨페티벌룬/버블벌룬',
        parentCategory: '고무풍선',
      },
      { code: '40g0', name: '조이파티 벌룬팩', parentCategory: '고무풍선' },
      {
        code: '40d0',
        name: '셈퍼텍스 원가이하세일',
        parentCategory: '고무풍선',
      },
      // 은박풍선 서브카테고리 (총 13개)
      { code: '2030', name: '숫자은박', parentCategory: '은박풍선' },
      { code: '20d0', name: '스틱풍선', parentCategory: '은박풍선' },
      { code: '20c0', name: '알파벳은박', parentCategory: '은박풍선' },
      { code: '20b0', name: '은박풍선세트', parentCategory: '은박풍선' },
      { code: '20a0', name: '솔리드은박', parentCategory: '은박풍선' },
      { code: '2090', name: '옹브레은박풍선', parentCategory: '은박풍선' },
      { code: '2080', name: '스탠딩에어벌룬', parentCategory: '은박풍선' },
      { code: '2070', name: '딜리버리팩/에어워커', parentCategory: '은박풍선' },
      { code: '2060', name: '워킹벌룬', parentCategory: '은박풍선' },
      { code: '2040', name: '은박미니쉐입', parentCategory: '은박풍선' },
      { code: '2050', name: '캐릭터라이센스', parentCategory: '은박풍선' },
      { code: '2020', name: '테마별 은박풍선', parentCategory: '은박풍선' },
      { code: '2010', name: '모양별 은박풍선', parentCategory: '은박풍선' },
    ],
    selectors: {
      productLinks:
        '.item-list a, .item-wrap a, .item-row a, a[href*="shop_view"]',
      productName: '.item-name, .item-subject',
      productPrice: '.item-price, .price',
      productImage: 'img.load_img, .img-wrap img, img',
      productContainer: '.item-list, .item-wrap, .item-row',
    },
  },
  joyparty: {
    id: 'joyparty',
    name: '조이파티 일반',
    baseUrl: 'https://www.joyparty.co.kr',
    categories: [
      { code: '048001', name: '고무풍선' },
      { code: '048002', name: '은박풍선' },
      { code: '048009', name: '풍선꽃다발/케이크' },
      { code: '048007', name: '은박풍선세트' },
      { code: '048006', name: '천장풍선세트' },
      { code: '048008', name: '벌룬가랜드' },
      { code: '048004', name: '풍선만들기' },
    ],
    selectors: {
      productLinks: 'a[href*="goods_view.php"]',
      productName: '',
      productPrice: '',
      productImage: 'img',
      productContainer: 'li, div',
    },
  },
};

// 기존 CATEGORIES는 joyparty 사이트용으로 유지 (하위호환성)
export const CATEGORIES: CategoryInfo[] = SITES.joyparty.categories;

export async function getMaxPagesForCategory(
  page: puppeteer.Page,
  categoryCode: string,
  siteId: string = 'joyparty'
): Promise<number> {
  const site = SITES[siteId];

  if (siteId === 'saeroevent') {
    // 새로이벤트 사이트 페이지네이션 확인 - 오타 수정
    const testUrl = `${site.baseUrl}/m_goods_list.php?ps_line=20&categoryid=${categoryCode}&ps_page=1`;

    try {
      await page.goto(testUrl, {
        waitUntil: 'networkidle2',
        timeout: 10000,
      });

      // 페이지네이션에서 최대 페이지 수 파싱
      const maxPage = await page.evaluate(() => {
        let maxPageNum = 1;

        // 페이지 링크들 확인
        const pageLinks = document.querySelectorAll('a[href*="ps_page="]');
        pageLinks.forEach((link) => {
          const href = link.getAttribute('href') || '';
          const pageMatch = href.match(/ps_page=(\d+)/);
          if (pageMatch) {
            const pageNum = parseInt(pageMatch[1]);
            if (pageNum > maxPageNum) {
              maxPageNum = pageNum;
            }
          }
        });

        // 총 상품 수로 추정
        const totalText = document.body.textContent || '';
        const totalMatch = totalText.match(/총\s*(\d+)\s*개/);
        if (totalMatch) {
          const totalProducts = parseInt(totalMatch[1]);
          const estimatedPages = Math.ceil(totalProducts / 20); // 페이지당 20개
          if (estimatedPages > maxPageNum) {
            maxPageNum = Math.min(estimatedPages, 10); // 최대 10페이지로 제한
          }
        }

        return Math.max(1, Math.min(maxPageNum, 5)); // 보수적으로 최대 5페이지
      });

      console.log(
        `${site.name} 카테고리 ${categoryCode} 최대 페이지: ${maxPage}`
      );
      return maxPage;
    } catch (error) {
      console.error(
        `${site.name} 카테고리 ${categoryCode} 페이지 수 확인 중 오류:`,
        error
      );
      return 1;
    }
  } else if (siteId === 'joypartyb2b') {
    // B2B 사이트는 첫 페이지에서 페이지네이션 HTML 파싱으로 빠르게 확인
    const testUrl = `${site.baseUrl}/shop/list.php?ca_id=${categoryCode}&page=1`;

    try {
      await page.goto(testUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 8000,
      });

      // 페이지네이션에서 최대 페이지 수 파싱 - 더 안전한 방식
      const maxPage = await page.evaluate(() => {
        let maxPageNum = 1;

        // 먼저 상품 수로 페이지 추정
        const totalText = document.body.textContent || '';
        const totalMatch = totalText.match(/총\s*(\d+)개의?\s*상품/);
        if (totalMatch) {
          const totalProducts = parseInt(totalMatch[1]);
          maxPageNum = Math.ceil(totalProducts / 50); // 페이지당 50개로 추정
        }

        // 페이지네이션 링크로 검증
        const pageLinks = document.querySelectorAll('a[href*="ca_id="]');
        pageLinks.forEach((link) => {
          const href = link.getAttribute('href') || '';
          const text = link.textContent?.trim() || '';

          // 숫자로 된 페이지 링크만 확인
          if (/^\d+$/.test(text) && href.includes('page=')) {
            const pageMatch = href.match(/[?&]page=(\d+)/);
            if (pageMatch) {
              const pageNum = parseInt(pageMatch[1]);
              // 상품 수 기반 추정값과 큰 차이가 나지 않으면 업데이트
              if (pageNum > maxPageNum && pageNum <= maxPageNum + 3) {
                maxPageNum = pageNum;
              }
            }
          }
        });

        return Math.max(1, Math.min(maxPageNum, 5)); // 최대 5페이지로 보수적 제한
      });

      console.log(
        `${site.name} 카테고리 ${categoryCode} 최대 페이지: ${maxPage}`
      );
      return maxPage;
    } catch (error) {
      console.error(
        `${site.name} 카테고리 ${categoryCode} 페이지 수 확인 중 오류:`,
        error
      );
      return 1;
    }
  }

  // 기존 사이트 로직
  const url: string = `${site.baseUrl}/goods/goods_list.php?page=1&cateCd=${categoryCode}`;

  try {
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // 페이지네이션에서 최대 페이지 수 찾기
    const maxPages = await page.evaluate(() => {
      // 기존 사이트용 페이지네이션 처리
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
      const lastPageLink = document.querySelector(
        'a[href*="page="]:last-of-type'
      );
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

    console.log(
      `${site.name} 카테고리 ${categoryCode} 최대 페이지: ${maxPages}`
    );
    return maxPages;
  } catch {
    console.error(
      `${site.name} 카테고리 ${categoryCode} 페이지 수 확인 중 오류`
    );
    return 1; // 기본값
  }
}

export async function scrapeSinglePage(
  page: puppeteer.Page,
  pageNum: number,
  categoryCode: string,
  siteId: string = 'joyparty'
): Promise<BalloonProduct[]> {
  const site = SITES[siteId];
  const categoryName =
    site.categories.find((cat) => cat.code === categoryCode)?.name ||
    categoryCode;

  let url: string;
  if (siteId === 'saeroevent') {
    url = `${site.baseUrl}/m_goods_list.php?ps_line=20&categoryid=${categoryCode}&ps_page=${pageNum}`;
  } else if (siteId === 'joypartyb2b') {
    url = `${site.baseUrl}/shop/list.php?ca_id=${categoryCode}&page=${pageNum}`;
  } else {
    url = `${site.baseUrl}/goods/goods_list.php?page=${pageNum}&cateCd=${categoryCode}`;
  }

  console.log(
    `${site.name} 카테고리 ${categoryName} 페이지 ${pageNum} 크롤링 중...`
  );

  // Navigate to the page - B2B 사이트의 동적 로딩을 위해 networkidle2 사용
  await page.goto(url, {
    waitUntil: 'networkidle2',
    timeout: 15000,
  });

  // 추가 대기 시간 (B2B 사이트의 동적 컨텐츠 로딩을 위해)
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // 상품 링크가 있는지 확인 - 새로이벤트의 경우 더 긴 대기 시간
  const waitTimeout = siteId === 'saeroevent' ? 10000 : 5000;
  try {
    await page.waitForSelector(site.selectors.productLinks, { timeout: waitTimeout });
  } catch {
    // 페이지 내용 디버깅을 위해 HTML 일부 확인
    const pageContent = await page.content();
    const currentUrl = page.url();
    
    console.log(`${site.name} 현재 URL: ${currentUrl}`);
    
    // 새로이벤트의 경우 로그인 상태 확인
    if (siteId === 'saeroevent' && currentUrl.includes('login.php')) {
      console.log('새로이벤트 로그인 상태가 만료되었습니다.');
      return [];
    }
    
    if (
      pageContent.includes('상품이 없습니다') ||
      pageContent.includes('등록된 상품이 없습니다')
    ) {
      console.log(
        `${site.name} 카테고리 ${categoryName} 페이지 ${pageNum}에 등록된 상품이 없습니다.`
      );
    } else {
      console.log(
        `${site.name} 카테고리 ${categoryName} 페이지 ${pageNum}에서 상품 링크를 찾을 수 없습니다.`
      );
      
      // 새로이벤트의 경우 추가 디버깅 정보
      if (siteId === 'saeroevent') {
        const linkCount = await page.evaluate(() => {
          return {
            allLinks: document.querySelectorAll('a').length,
            productLinks: document.querySelectorAll('a[href*="m_goods_detail.php"]').length,
            images: document.querySelectorAll('img').length
          };
        });
        console.log(`디버깅 정보 - 전체 링크: ${linkCount.allLinks}, 상품 링크: ${linkCount.productLinks}, 이미지: ${linkCount.images}`);
      }
    }
    return [];
  }

  // Extract product information
  const products = await page.evaluate(
    (
      categoryName: string,
      categoryCode: string,
      siteConfig: SiteConfig,
      siteName: string
    ) => {
      const productList: BalloonProduct[] = [];

      // 상품 링크 찾기
      const productLinks = document.querySelectorAll(
        siteConfig.selectors.productLinks
      );

      productLinks.forEach((link) => {
        const container =
          link.closest(siteConfig.selectors.productContainer) ||
          link.parentElement;

        if (!container) return;

        // 상품명 추출
        let productName = '';

        if (siteConfig.id === 'saeroevent') {
          // 새로이벤트 사이트용 - 이미지 alt 속성에서 상품명 추출
          const img = container.querySelector('img');
          if (img) {
            productName = img.getAttribute('alt')?.trim() || '';
          }
          
          // alt가 없으면 링크의 title 속성이나 텍스트 확인
          if (!productName) {
            productName = link.getAttribute('title') || link.textContent?.trim() || '';
          }
        } else if (siteConfig.id === 'joypartyb2b') {
          // B2B 사이트용 상품명 추출 - title 속성이나 전체 텍스트 우선
          const nameElement =
            container.querySelector(siteConfig.selectors.productName) ||
            container.querySelector('.item-name');
          if (nameElement) {
            // title 속성에서 전체 이름 추출 (CSS로 짤리기 전의 원본)
            productName =
              nameElement.getAttribute('title') ||
              nameElement.textContent?.trim() ||
              '';
          } else {
            // 링크에서 title 속성 확인
            productName =
              link.getAttribute('title') || link.textContent?.trim() || '';
          }
        } else {
          // 기존 사이트용 상품명 추출
          const textContent = link.textContent?.trim() || '';
          if (textContent && textContent.length > 0) {
            productName = textContent
              .replace(/[\d,]+원/g, '')
              .replace(/\s+/g, ' ')
              .trim();
          }
        }

        // 상품명이 없거나 너무 짧으면 건너뛰기
        if (!productName || productName.length < 2) return;

        // "..."이 포함된 줄임표시 상품명은 건너뛰기 (중복 방지)
        if (
          productName.includes('...') ||
          productName.endsWith('…') ||
          productName.includes('…') ||
          productName.endsWith('[…') ||
          productName.includes('[…')
        )
          return;

        // "DC"가 포함된 상품명은 제외
        if (productName.includes('DC')) return;

        // 수량 정보가 포함된 중복 상품명 제외 - (1/숫자/숫자) 패턴
        if (/\(\d+\/\d+\/?\d*\)$/.test(productName)) {
          console.log(`수량 정보 포함 상품 제외: ${productName}`);
          return;
        }

        // 이미지 URL 추출
        let imageUrl = '';
        const img =
          container.querySelector(siteConfig.selectors.productImage) ||
          link.querySelector('img');
        if (img) {
          imageUrl =
            img.getAttribute('src') ||
            img.getAttribute('data-original') ||
            img.getAttribute('data-src') ||
            '';

          // URL 정리
          if (imageUrl && !imageUrl.startsWith('http')) {
            if (imageUrl.startsWith('//')) {
              imageUrl = 'https:' + imageUrl;
            } else if (imageUrl.startsWith('/')) {
              imageUrl = siteConfig.baseUrl + imageUrl;
            } else if (imageUrl.startsWith('../')) {
              imageUrl =
                siteConfig.baseUrl +
                '/goods/' +
                imageUrl.replace(/^\.\.\//, '');
            } else {
              imageUrl = siteConfig.baseUrl + '/' + imageUrl;
            }
          }
        }

        // 가격 추출
        let price = '';
        let originalPrice = '';

        if (siteConfig.id === 'saeroevent' || siteConfig.id === 'joypartyb2b') {
          // 새로이벤트 및 B2B 사이트용 가격 추출
          const priceElement = container.querySelector(
            siteConfig.selectors.productPrice
          );
          if (priceElement) {
            const priceText = priceElement.textContent || '';
            const priceMatches = priceText.match(/[\d,]+원?/g);
            if (priceMatches && priceMatches.length > 0) {
              price = priceMatches[priceMatches.length - 1];
              if (priceMatches.length > 1) {
                originalPrice = priceMatches[0];
              }
            }
          }
        } else {
          // 기존 사이트용 가격 추출
          const priceText = container.textContent || '';
          const priceMatches = priceText.match(/[\d,]+원/g);
          if (priceMatches && priceMatches.length > 0) {
            if (priceMatches.length > 1) {
              originalPrice = priceMatches[priceMatches.length - 2];
              price = priceMatches[priceMatches.length - 1];
            } else {
              price = priceMatches[0];
            }
          }
        }

        // 링크 URL 정리
        let productLink = link.getAttribute('href') || '';
        if (productLink && !productLink.startsWith('http')) {
          if (productLink.startsWith('//')) {
            productLink = 'https:' + productLink;
          } else if (productLink.startsWith('/')) {
            productLink = siteConfig.baseUrl + productLink;
          } else if (productLink.startsWith('../')) {
            productLink = siteConfig.baseUrl + productLink.replace(/^\.\./, '');
          } else {
            productLink = siteConfig.baseUrl + '/' + productLink;
          }
        }

        productList.push({
          name: productName,
          price: price,
          originalPrice: originalPrice,
          imageUrl: imageUrl,
          link: productLink,
          category: categoryName,
          categoryCode: categoryCode,
          site: siteName,
        });
      });

      // 중복 제거: 같은 상품의 완전한 이름과 줄임 이름이 있을 때 완전한 이름만 유지
      const uniqueProducts: BalloonProduct[] = [];
      const seenProducts = new Set<string>();

      // 줄임표시가 없는 완전한 상품명을 우선적으로 처리
      const fullNames = productList.filter(
        (p) => !p.name.includes('...') && !p.name.includes('…')
      );
      const truncatedNames = productList.filter(
        (p) => p.name.includes('...') || p.name.includes('…')
      );

      // 완전한 이름들을 먼저 추가
      fullNames.forEach((product) => {
        const normalizedName = product.name.trim().toLowerCase();
        if (!seenProducts.has(normalizedName)) {
          seenProducts.add(normalizedName);
          uniqueProducts.push(product);
        }
      });

      // 줄임 이름들은 유사한 완전한 이름이 없는 경우에만 추가
      truncatedNames.forEach((product) => {
        const baseName = product.name
          .replace(/\s*\.\.\.\s*$/, '')
          .replace(/\s*…\s*$/, '')
          .trim()
          .toLowerCase();
        let shouldAdd = true;

        // 이미 추가된 완전한 이름들과 비교
        for (const existingName of seenProducts) {
          if (
            existingName.startsWith(baseName) ||
            baseName.startsWith(existingName)
          ) {
            shouldAdd = false;
            break;
          }
        }

        if (shouldAdd && !seenProducts.has(baseName)) {
          seenProducts.add(baseName);
          uniqueProducts.push(product);
        }
      });

      return uniqueProducts;
    },
    categoryName,
    categoryCode,
    site,
    site.name
  );

  console.log(
    `${site.name} 카테고리 ${categoryName} 페이지 ${pageNum}에서 ${products.length}개 상품 발견`
  );
  return products;
}

// 새로이벤트 로그인 함수
async function loginToSaeroEvent(
  page: puppeteer.Page
): Promise<boolean> {
  try {
    const username = process.env.SAEROEVENT_USERNAME;
    const password = process.env.SAEROEVENT_PASSWORD;

    if (!username || !password) {
      console.error('새로이벤트 로그인 정보가 환경 변수에 없습니다.');
      return false;
    }

    console.log('새로이벤트 로그인 시도 중...');

    // 로그인 페이지로 이동
    await page.goto('https://www.saeroeventb2b.co.kr:10497/login.php', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // 페이지 완전 로딩을 위한 추가 대기
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 로그인 폼 요소 대기 및 입력 - 디버깅에서 확인된 정확한 셀렉터 사용
    try {
      // 정확한 셀렉터로 직접 대기
      await page.waitForSelector('input[name="id"]', { timeout: 10000 });
      await page.waitForSelector('input[name="pw"]', { timeout: 5000 });
      
      console.log('로그인 입력 필드 확인됨');
      
      // 입력 필드 클리어 후 입력
      await page.click('input[name="id"]');
      await page.evaluate(() => {
        const idInput = document.querySelector('input[name="id"]') as HTMLInputElement;
        if (idInput) idInput.value = '';
      });
      await page.type('input[name="id"]', username);
      
      await page.click('input[name="pw"]');
      await page.evaluate(() => {
        const pwInput = document.querySelector('input[name="pw"]') as HTMLInputElement;
        if (pwInput) pwInput.value = '';
      });
      await page.type('input[name="pw"]', password);
      
    } catch (error) {
      console.error('로그인 입력 필드를 찾을 수 없습니다.', error);
      
      // 디버그: 페이지 상태 확인
      const debugInfo = await page.evaluate(() => {
        return {
          url: window.location.href,
          title: document.title,
          readyState: document.readyState,
          inputCount: document.querySelectorAll('input').length,
          formCount: document.querySelectorAll('form').length,
          bodyText: document.body.textContent?.substring(0, 200) || ''
        };
      });
      console.log('디버그 정보:', debugInfo);
      return false;
    }

    // 로그인 버튼 클릭 - 새로이벤트는 a 태그를 사용
    const loginButton = await page.$('#login');
    if (loginButton) {
      console.log('로그인 버튼 클릭');
      await loginButton.click();
    } else {
      // 대체 방법: JavaScript 함수 직접 호출
      console.log('로그인 함수 직접 호출');
      await page.evaluate(() => {
        if (typeof (window as any).login === 'function') {
          (window as any).login();
        } else {
          // 폼 직접 제출
          const form = document.querySelector('form') as HTMLFormElement;
          if (form) form.submit();
        }
      });
    }

    // 로그인 후 페이지 대기
    try {
      await page.waitForNavigation({
        waitUntil: 'networkidle2',
        timeout: 15000,
      });
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    // 로그인 성공 확인
    const currentUrl = page.url();
    const isLoggedIn = !currentUrl.includes('login.php');

    if (isLoggedIn) {
      console.log('새로이벤트 로그인 성공!');
      return true;
    } else {
      console.error('새로이벤트 로그인 실패');
      return false;
    }
  } catch (error) {
    console.error('새로이벤트 로그인 중 오류:', error);
    return false;
  }
}

export async function scrapeByCategory(
  categoryCode: string,
  maxPages?: number,
  siteId: string = 'joyparty'
): Promise<BalloonProduct[]> {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  try {
    const page = await browser.newPage();
    const site = SITES[siteId];

    // Set a user agent 먼저 설정
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // 새로이벤트의 경우 로그인 먼저 수행
    if (siteId === 'saeroevent') {
      console.log('새로이벤트 로그인 시도...');
      const loginSuccess = await loginToSaeroEvent(page);
      if (!loginSuccess) {
        console.error('새로이벤트 로그인 실패로 크롤링을 중단합니다.');
        return [];
      }
      console.log('새로이벤트 로그인 성공, 크롤링 계속 진행');
    }

    const categoryName =
      site.categories.find((cat) => cat.code === categoryCode)?.name ||
      categoryCode;
    console.log(`${site.name} 카테고리 ${categoryName} 크롤링 시작`);

    // 최대 페이지 수 확인 (제공되지 않은 경우)
    if (!maxPages) {
      maxPages = await getMaxPagesForCategory(page, categoryCode, siteId);
    }

    const allProducts: BalloonProduct[] = [];

    // Scrape all pages for this category with early termination
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        const products = await scrapeSinglePage(
          page,
          pageNum,
          categoryCode,
          siteId
        );

        // 빈 페이지 조기 종료
        if (products.length === 0 && pageNum > 1) {
          console.log(
            `${site.name} 카테고리 ${categoryName} 페이지 ${pageNum}가 비어있어서 크롤링 중단`
          );
          break;
        }

        allProducts.push(...products);

        // 페이지간 딜레이 단축
        if (pageNum < maxPages) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      } catch (error: unknown) {
        console.error('Error normalizing URL:', error);
        console.error(
          `${site.name} 카테고리 ${categoryName} 페이지 ${pageNum} 크롤링 중 오류:`,
          error
        );
        // 오류 발생 시에도 조기 종료 고려
        if (pageNum > 1) break;
      }
    }

    console.log(
      `${site.name} 카테고리 ${categoryName} 크롤링 완료: ${allProducts.length}개 상품`
    );
    return allProducts;
  } finally {
    await browser.close();
  }
}

export async function scrapeAllCategories(
  selectedCategories?: string[],
  siteId: string = 'joyparty'
): Promise<Map<string, BalloonProduct[]>> {
  const site = SITES[siteId];
  const categoriesToScrape = selectedCategories
    ? site.categories.filter((cat) => selectedCategories.includes(cat.code))
    : site.categories;

  const resultMap = new Map<string, BalloonProduct[]>();

  console.log(
    `${site.name} ${categoriesToScrape.length}개 카테고리 크롤링 시작`
  );

  for (const category of categoriesToScrape) {
    try {
      const products = await scrapeByCategory(category.code, undefined, siteId);
      resultMap.set(category.code, products);

      // 카테고리간 짧은 딜레이
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(
        `${site.name} 카테고리 ${category.name} 크롤링 실패:`,
        error
      );
      resultMap.set(category.code, []);
    }
  }

  return resultMap;
}

export function createMultiCategoryExcelFile(
  categoryProductsMap: Map<string, BalloonProduct[]>,
  siteId: string = 'joyparty'
): Buffer {
  // Create a new workbook
  const wb = XLSX.utils.book_new();
  const site = SITES[siteId];

  // 전체 상품 수 계산
  let totalProducts = 0;
  categoryProductsMap.forEach((products) => (totalProducts += products.length));

  // 모든 사이트에 대해 개별 카테고리별로 시트 생성
  categoryProductsMap.forEach((products, categoryCode) => {
    const category = site.categories.find((cat) => cat.code === categoryCode);
    const categoryName = category?.name || categoryCode;
    const sheetName = `${categoryName}`.replace(/[:\\/\?\*\[\]]/g, '_');

    console.log(`엑셀 시트 생성: ${sheetName}`);

    const worksheetData = products.map((product, index) => ({
      번호: index + 1,
      상품명: product.name,
    }));

    const ws = XLSX.utils.json_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  // 버퍼로 변환
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return Buffer.from(buffer);
}

// 기존 함수들 (하위 호환성을 위해 유지)
export async function scrapeBalloonProducts(): Promise<BalloonProduct[]> {
  // 기존 전체 크롤링 방식 (joyparty 사이트)
  const allProducts = await scrapeAllCategories();
  const result: BalloonProduct[] = [];

  allProducts.forEach((products) => {
    result.push(...products);
  });

  return result;
}

export function createExcelFile(products: BalloonProduct[]): Buffer {
  const wb = XLSX.utils.book_new();

  const wsData = [
    [
      '번호',
      '사이트',
      '상품명',
      '판매가격',
      '원가',
      '이미지 URL',
      '상품 링크',
      '카테고리',
    ],
    ...products.map((p, index) => [
      index + 1,
      p.site || '조이파티',
      p.name,
      p.price || '',
      p.originalPrice || '',
      p.imageUrl || '',
      p.link || '',
      p.category || '',
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 8 },
    { wch: 15 },
    { wch: 50 },
    { wch: 15 },
    { wch: 15 },
    { wch: 80 },
    { wch: 80 },
    { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'All Products');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return Buffer.from(buffer);
}
