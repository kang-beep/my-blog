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

export function formatDateTime(dateInput) {
  if (!dateInput) {
    return "";
  }

  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function getMostRecentDate(createdAt, updatedAt) {
  if (!createdAt && !updatedAt) {
    return null;
  }

  if (!createdAt) {
    return updatedAt;
  }

  if (!updatedAt) {
    return createdAt;
  }

  const createdDate = new Date(createdAt);
  const updatedDate = new Date(updatedAt);
  if (Number.isNaN(createdDate.getTime())) {
    return updatedAt;
  }
  if (Number.isNaN(updatedDate.getTime())) {
    return createdAt;
  }

  return updatedDate > createdDate ? updatedAt : createdAt;
}

export function isSameMinute(left, right) {
  if (!left || !right) {
    return false;
  }

  const leftDate = new Date(left);
  const rightDate = new Date(right);
  if (Number.isNaN(leftDate.getTime()) || Number.isNaN(rightDate.getTime())) {
    return false;
  }

  return leftDate.getTime() === rightDate.getTime();
}
