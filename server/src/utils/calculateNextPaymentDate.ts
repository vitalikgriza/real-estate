export const calculateNextPaymentDate = (startDate: Date): Date => {
  const nextPaymentDate = new Date(startDate);
  nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
  return nextPaymentDate;
}
