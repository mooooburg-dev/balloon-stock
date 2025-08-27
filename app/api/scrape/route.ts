import { NextResponse } from 'next/server';
import { scrapeBalloonProducts, createExcelFile } from '@/lib/scraper';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, pages } = body;
    
    // Default to 43 pages if not specified
    const maxPages = pages || 43;
    
    console.log(`Starting to scrape ${maxPages} pages...`);
    
    // Scrape products from all pages
    const products = await scrapeBalloonProducts(url || 'https://www.joyparty.co.kr/goods/goods_list.php?cateCd=048', maxPages);
    
    if (products.length === 0) {
      return NextResponse.json(
        { error: 'No products found' },
        { status: 404 }
      );
    }

    console.log(`Creating Excel file with ${products.length} products...`);
    
    // Create Excel file
    const excelBuffer = createExcelFile(products);
    
    // Return the Excel file as a response
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="balloon_products_${Date.now()}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json(
      { error: 'Failed to scrape products', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const pages = searchParams.get('pages') ? parseInt(searchParams.get('pages')!) : 1;
    const preview = searchParams.get('preview') === 'true';
    
    // Default URL for the balloon category
    const defaultUrl = 'https://www.joyparty.co.kr/goods/goods_list.php?cateCd=048';
    
    console.log(`Scraping ${pages} page(s) for preview...`);
    
    // Scrape products (for preview, limit to specified pages)
    const products = await scrapeBalloonProducts(defaultUrl, pages);
    
    if (products.length === 0) {
      return NextResponse.json(
        { error: 'No products found' },
        { status: 404 }
      );
    }

    // Return products as JSON for preview
    return NextResponse.json({
      success: true,
      totalPages: pages,
      count: products.length,
      products: preview ? products.slice(0, 50) : products // Limit preview to 50 products
    });
  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json(
      { error: 'Failed to scrape products', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}