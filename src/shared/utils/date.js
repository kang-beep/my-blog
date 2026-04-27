// 날짜 표기 형식을 통일하기 위한 공용 유틸 함수
export function formatDate(dateInput) {
  const date = dateInput ? new Date(dateInput) : new Date();

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
