import { NextResponse } from 'next/server';
import { scrapeAllCategories, scrapeByCategory, createMultiCategoryExcelFile, CATEGORIES } from '@/lib/scraper';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { categories, mode = 'all' } = body;
    
    console.log(`크롤링 모드: ${mode}, 선택된 카테고리: ${categories ? categories.join(', ') : '전체'}`);
    
    let categoryProductsMap: Map<string, any[]>;
    
    if (mode === 'category' && categories && categories.length > 0) {
      // 선택된 카테고리만 크롤링
      categoryProductsMap = await scrapeAllCategories(categories);
    } else {
      // 전체 카테고리 크롤링
      categoryProductsMap = await scrapeAllCategories();
    }
    
    // 총 상품 수 확인
    let totalProducts = 0;
    categoryProductsMap.forEach(products => totalProducts += products.length);
    
    if (totalProducts === 0) {
      return NextResponse.json(
        { error: '상품을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    console.log(`총 ${totalProducts}개 상품으로 엑셀 파일 생성 중...`);
    
    // 카테고리별 다중 탭 엑셀 파일 생성
    const excelBuffer = createMultiCategoryExcelFile(categoryProductsMap);
    
    // 파일명에 타임스탬프와 카테고리 정보 포함
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const categoryInfo = mode === 'category' && categories ? 
      `_${categories.length}categories` : '_all';
    const filename = `balloon_products${categoryInfo}_${timestamp}.xlsx`;
    
    // Return the Excel file as a response
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('크롤링 중 오류:', error);
    return NextResponse.json(
      { 
        error: '크롤링 실패', 
        details: error instanceof Error ? error.message : '알 수 없는 오류' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const preview = searchParams.get('preview') === 'true';
    const getCategoriesInfo = searchParams.get('categories') === 'true';
    
    // 카테고리 정보만 요청하는 경우
    if (getCategoriesInfo) {
      return NextResponse.json({
        success: true,
        categories: CATEGORIES
      });
    }
    
    console.log(`미리보기 요청 - 카테고리: ${category || '전체'}`);
    
    let products: any[] = [];
    
    if (category && category !== 'all') {
      // 특정 카테고리의 첫 페이지만 크롤링
      products = await scrapeByCategory(category, 1);
    } else {
      // 모든 카테고리의 첫 페이지 크롤링
      const categoryProductsMap = await scrapeAllCategories();
      
      // 각 카테고리에서 최대 10개씩만 가져와서 미리보기 생성
      categoryProductsMap.forEach((categoryProducts) => {
        products.push(...categoryProducts.slice(0, 10));
      });
    }
    
    if (products.length === 0) {
      return NextResponse.json(
        { error: '상품을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 미리보기용으로 제한
    const previewProducts = preview ? products.slice(0, 50) : products;
    
    // 카테고리별 상품 수 집계
    const categoryStats = {};
    products.forEach(product => {
      const categoryName = product.category || '기타';
      categoryStats[categoryName] = (categoryStats[categoryName] || 0) + 1;
    });

    // Return products as JSON for preview
    return NextResponse.json({
      success: true,
      mode: category ? 'category' : 'all',
      category: category,
      totalCount: products.length,
      previewCount: previewProducts.length,
      categoryStats: categoryStats,
      products: previewProducts
    });
  } catch (error) {
    console.error('미리보기 중 오류:', error);
    return NextResponse.json(
      { 
        error: '미리보기 실패', 
        details: error instanceof Error ? error.message : '알 수 없는 오류' 
      },
      { status: 500 }
    );
  }
}