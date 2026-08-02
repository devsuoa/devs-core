const getPaginationItems = (currentPage: number, totalPages: number) => {
  if (totalPages <= (window.innerWidth <= 1024 ? 4 : 7)) {
    // If total pages <= 4, show all pages without ellipsis
    return Array.from({ length: totalPages }, (_, i) => ({
      type: "page" as const,
      value: i,
    }));
  }

  const lastPageIndex = totalPages - 1;
  const items: Array<{ type: "page" | "ellipsis"; value: number }> = [];

  // When near the end (within last 3 pages), show previous pages
  if (currentPage >= lastPageIndex - 2) {
    // Show: [lastPage-3] [lastPage-2] [lastPage-1] [lastPage]
    for (let i = lastPageIndex - 3; i <= lastPageIndex; i++) {
      items.push({ type: "page", value: i });
    }
  } else {
    // Show: [currentPage] [currentPage+1] [...] [lastPage]
    items.push({ type: "page", value: currentPage });
    items.push({ type: "page", value: currentPage + 1 });
    items.push({ type: "ellipsis", value: -1 });
    items.push({ type: "page", value: lastPageIndex });
  }

  return items;
};

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  const items = getPaginationItems(currentPage, totalPages);
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === totalPages - 1;

  return (
    <div className="flex flex-col items-center gap-0">
      {/* Primary Pagination Row */}
      <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
        {/* Previous Arrow */}
        <button
          onClick={() => !isFirstPage && onPageChange(currentPage - 1)}
          disabled={isFirstPage}
          className={`pagination-link px-3 sm:px-3 md:px-4 lg:px-5 py-2 sm:py-2 md:py-2.5 text-sm sm:text-base md:text-lg lg:text-xl ${
            isFirstPage
              ? "opacity-50 cursor-not-allowed"
              : "hover:text-[#6b7fd7]"
          }`}
          aria-label="Previous page"
        >
          {"<"}
        </button>

        {/* Page Items */}
        {items.map((item, index) => (
          <span key={index}>
            {item.type === "ellipsis" ? (
              <span className="pagination-break-link px-1 sm:px-1.5 md:px-2 text-sm sm:text-base md:text-lg lg:text-xl">
                ...
              </span>
            ) : (
              <button
                onClick={() => onPageChange(item.value)}
                className={`pagination-link px-2 sm:px-2.5 md:px-3 lg:px-4 py-1.5 sm:py-2 md:py-2.5 min-w-[28px] sm:min-w-[32px] md:min-w-[40px] lg:min-w-[48px] text-sm sm:text-base md:text-lg lg:text-xl ${
                  item.value === currentPage
                    ? "text-[#6b7fd7] font-bold bg-[#6b7fd7]/20 border-2 border-[#6b7fd7]"
                    : "hover:text-[#6b7fd7]"
                }`}
              >
                {item.value + 1}
              </button>
            )}
          </span>
        ))}

        {/* Next Arrow */}
        <button
          onClick={() => !isLastPage && onPageChange(currentPage + 1)}
          disabled={isLastPage}
          className={`pagination-link px-3 sm:px-3 md:px-4 lg:px-5 py-2 sm:py-2 md:py-2.5 text-sm sm:text-base md:text-lg lg:text-xl ${
            isLastPage
              ? "opacity-50 cursor-not-allowed"
              : "hover:text-[#6b7fd7]"
          }`}
          aria-label="Next page"
        >
          {">"}
        </button>
      </div>

      {/* First & Last Buttons Row */}
      <div className="flex items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        <button
          onClick={() => !isFirstPage && onPageChange(0)}
          disabled={isFirstPage}
          className={`pagination-link px-3 sm:px-4 md:px-5 lg:px-6 py-0.5 sm:py-1 text-xs sm:text-sm md:text-base lg:text-lg ${
            isFirstPage
              ? "opacity-50 cursor-not-allowed"
              : "hover:text-[#6b7fd7]"
          }`}
          aria-label="First page"
        >
          First
        </button>

        <button
          onClick={() => !isLastPage && onPageChange(totalPages - 1)}
          disabled={isLastPage}
          className={`pagination-link px-3 sm:px-4 md:px-5 lg:px-6 py-0.5 sm:py-1 text-xs sm:text-sm md:text-base lg:text-lg ${
            isLastPage
              ? "opacity-50 cursor-not-allowed"
              : "hover:text-[#6b7fd7]"
          }`}
          aria-label="Last page"
        >
          Last
        </button>
      </div>
    </div>
  );
};

export default Pagination;
