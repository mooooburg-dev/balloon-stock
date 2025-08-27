'use client';

import { useState, useEffect } from 'react';

interface Category {
  code: string;
  name: string;
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [crawlingMode, setCrawlingMode] = useState<'all' | 'category'>('all');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [categoryStats, setCategoryStats] = useState<Record<string, number>>({});

  // 컴포넌트 마운트 시 카테고리 정보 가져오기
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/scrape?categories=true');
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
        // 기본적으로 모든 카테고리 선택
        setSelectedCategories(data.categories.map((cat: Category) => cat.code));
      }
    } catch (error) {
      console.error('카테고리 정보 로딩 실패:', error);
    }
  };

  const handleCategoryToggle = (categoryCode: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryCode)) {
        return prev.filter(code => code !== categoryCode);
      } else {
        return [...prev, categoryCode];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedCategories.length === categories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(categories.map(cat => cat.code));
    }
  };

  const handlePreview = async () => {
    setLoading(true);
    setError('');
    setProducts([]);
    setProgress('미리보기 생성 중...');

    try {
      const url = crawlingMode === 'category' && selectedCategories.length > 0
        ? `/api/scrape?preview=true&category=${selectedCategories[0]}`
        : '/api/scrape?preview=true&category=all';

      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setProducts(data.products);
        setCategoryStats(data.categoryStats || {});
        setProgress('');
      } else {
        setError(data.error || '미리보기 실패');
        setProgress('');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.');
      setProgress('');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (crawlingMode === 'category' && selectedCategories.length === 0) {
      setError('최소 하나의 카테고리를 선택해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    setProgress(
      crawlingMode === 'all' 
        ? '전체 7개 카테고리 크롤링 중... (약 5-10분 소요)'
        : `선택된 ${selectedCategories.length}개 카테고리 크롤링 중...`
    );

    try {
      const requestBody = {
        mode: crawlingMode,
        categories: crawlingMode === 'category' ? selectedCategories : undefined
      };

      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        
        // 파일명을 Content-Disposition에서 추출하거나 기본값 사용
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || 
          `balloon_products_${Date.now()}.xlsx`;
        
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        setProgress('다운로드 완료!');
        setTimeout(() => setProgress(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || '엑셀 다운로드 실패');
        setProgress('');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.');
      setProgress('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">풍선 상품 크롤러</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Joy Party 웹사이트에서 카테고리별로 풍선 상품 정보를 수집하여 엑셀 파일로 다운로드합니다.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        {/* 크롤링 모드 선택 */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-3">크롤링 모드</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="crawlingMode"
                value="all"
                checked={crawlingMode === 'all'}
                onChange={(e) => setCrawlingMode(e.target.value as 'all' | 'category')}
                disabled={loading}
                className="mr-2"
              />
              전체 카테고리 (7개)
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="crawlingMode"
                value="category"
                checked={crawlingMode === 'category'}
                onChange={(e) => setCrawlingMode(e.target.value as 'all' | 'category')}
                disabled={loading}
                className="mr-2"
              />
              선택 카테고리
            </label>
          </div>
        </div>

        {/* 카테고리 선택 */}
        {crawlingMode === 'category' && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium">
                크롤링할 카테고리 선택 ({selectedCategories.length}/{categories.length})
              </label>
              <button
                onClick={handleSelectAll}
                disabled={loading}
                className="text-blue-500 hover:text-blue-700 text-sm"
              >
                {selectedCategories.length === categories.length ? '전체 해제' : '전체 선택'}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((category) => (
                <label key={category.code} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.code)}
                    onChange={() => handleCategoryToggle(category.code)}
                    disabled={loading}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">{category.name}</div>
                    <div className="text-xs text-gray-500">{category.code}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={handlePreview}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading && progress.includes('미리보기') ? '로딩중...' : '미리보기'}
          </button>
          <button
            onClick={handleDownload}
            disabled={loading}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading && !progress.includes('미리보기') ? '크롤링 중...' : 
             crawlingMode === 'all' ? '전체 카테고리 엑셀 다운로드' : 
             `선택 카테고리 엑셀 다운로드`}
          </button>
        </div>

        {progress && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-600 dark:text-blue-400">
            {progress}
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            <strong>새로운 기능:</strong> 카테고리별로 나누어진 엑셀 파일을 다운로드할 수 있습니다.
            각 카테고리는 별도의 탭으로 구성되며, 요약 탭도 포함됩니다.
          </p>
        </div>
      </div>

      {/* 카테고리 통계 */}
      {Object.keys(categoryStats).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-bold mb-4">카테고리별 상품 수</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(categoryStats).map(([category, count]) => (
              <div key={category} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="font-medium">{category}</div>
                <div className="text-2xl font-bold text-blue-600">{count}개</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {products.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">상품 목록 미리보기 ({products.length}개)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-2 px-4">번호</th>
                  <th className="text-left py-2 px-4">카테고리</th>
                  <th className="text-left py-2 px-4">상품명</th>
                  <th className="text-left py-2 px-4">판매가</th>
                  <th className="text-left py-2 px-4">원가</th>
                  <th className="text-left py-2 px-4">이미지</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr key={index} className="border-b dark:border-gray-700">
                    <td className="py-2 px-4">{index + 1}</td>
                    <td className="py-2 px-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {product.category}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      <a 
                        href={product.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {product.name}
                      </a>
                    </td>
                    <td className="py-2 px-4">{product.price}</td>
                    <td className="py-2 px-4 line-through text-gray-500">{product.originalPrice}</td>
                    <td className="py-2 px-4">
                      {product.imageUrl && (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}