export default (
  now?: Date,
): {
  year: string;
  month: string;
  day: string;
  time: string;
} => {
  now = now || new Date();
  return {
    year: String(now.getFullYear()),
    month: String(now.getMonth() + 1).padStart(2, '0'),
    day: String(now.getDate()).padStart(2, '0'),
    time: now.toTimeString().split(' ')[0], // HH:MM:SS
  };
};
