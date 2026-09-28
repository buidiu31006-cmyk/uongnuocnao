export interface NotificationMessage {
  title: string;
  body: string;
}

// 1. General trendy notification templates
const GENERAL_TRENDY_NOTIFICATIONS: NotificationMessage[] = [
  {
    title: '💧 Alooo, uống nước đi bà!',
    body: 'Cơ thể đang réo tên bạn đó 😭',
  },
  {
    title: '👀 Ê... nước đâu?',
    body: 'Đi uống một ngụm rồi quay lại nha 💧',
  },
  {
    title: '🚨 BREAKING NEWS',
    body: 'Bạn vừa được nhắc uống nước đó! Đi lấy nước lẹ nào 💧',
  },
  {
    title: '💦 STOP SCROLLING!',
    body: 'Uống nước trước rồi lướt tiếp 👀💧',
  },
  {
    title: '📢 Ting ting!',
    body: 'Đây là tín hiệu vũ trụ nhắc bạn đi uống nước 💧',
  },
  {
    title: '🥤 Ly nước đang nhớ bạn',
    body: 'Làm một ngụm mát lạnh rồi tiếp tục nè ✨',
  },
  {
    title: '💧 CHECK NƯỚC!',
    body: 'Một ngụm thôi, đứng dậy vươn vai nào! 🏃‍♂️',
  },
  {
    title: '😭 Bạn lại quên uống nước rồi...',
    body: 'Đi lấy nước ngay kẻo da dẻ than phiền đó 💧',
  },
  {
    title: '✨ RESET NHẸ',
    body: 'Uống miếng nước rồi tiếp tục chiến nào! 🔥',
  },
  {
    title: '💧 YOUR WATER CHECK',
    body: 'Nạp năng lượng bằng một ly nước đầy ngay thôi! 🚀',
  },
  {
    title: '👋 Psst...',
    body: 'Có ly nước đang chờ bạn kìa, đi uống lẹ! 👀',
  },
  {
    title: '🚨 NHIỆM VỤ MỚI',
    body: 'Uống nước xong rồi quay lại làm tiếp nha 💧',
  },
  {
    title: '💦 Một ngụm thôi!',
    body: 'Uống nước rồi làm tiếp cho tỉnh táo nè 🧠✨',
  },
  {
    title: '👀 CHECK-IN NÈ',
    body: 'Hôm nay bạn đã chăm sóc cơ thể đủ chưa đó? 💧',
  },
  {
    title: '💧 BESTIE ALERT',
    body: 'Đi uống nước với tui không? Đừng lười nữa 😭',
  },
  {
    title: '📣 Ê bạn ơi!',
    body: 'Nước tới giờ rồi đó, đừng để họng khô khát nha 💧',
  },
  {
    title: '🥹 Đừng bỏ quên ly nước',
    body: 'Uống một chút rồi tiếp tục tập trung nhé ✨',
  },
  {
    title: '💧 WATER BREAK!',
    body: 'Nghỉ tay 30 giây, uống miếng nước nào 🥤',
  },
];

/**
 * Returns situational, trendy, actionable notification copy based on user's current progress.
 */
export function getContextualNotification(
  currentMl: number,
  targetMl: number
): NotificationMessage | null {
  const percentage = targetMl > 0 ? (currentMl / targetMl) * 100 : 0;

  // 1. If reached 120% max limit: STOP sending push/reminders to drink more!
  if (percentage >= 120) {
    return null;
  }

  // 2. If near limit (110% - 119%): gentle compliment, do not push to drink more
  if (percentage >= 110) {
    const nearLimitOptions: NotificationMessage[] = [
      {
        title: '✨ Bạn làm tốt lắm rồi!',
        body: 'Hôm nay đã nạp đủ nước rồi nè, không cần cố uống thêm chỉ để tăng % đâu nhé 💧',
      },
      {
        title: '🏆 Đạt chỉ tiêu xịn xò!',
        body: 'Cơ thể bạn hôm nay đã được cấp ẩm trọn vẹn rồi đó ✨',
      },
    ];
    return nearLimitOptions[Math.floor(Math.random() * nearLimitOptions.length)];
  }

  // 3. If reached goal (100% - 109%): celebrate, gentle reminder
  if (percentage >= 100) {
    const reachedGoalOptions: NotificationMessage[] = [
      {
        title: '🎉 DONE! Đạt mục tiêu rồi nè!',
        body: 'Bạn đã hoàn thành mục tiêu hôm nay. Cứ uống theo nhu cầu tự nhiên nhé 💧',
      },
      {
        title: '🌟 BESTIE 10 ĐIỂM!',
        body: 'Hôm nay uống đủ nước xuất sắc quá! Giữ phong độ nha ✨',
      },
    ];
    return reachedGoalOptions[Math.floor(Math.random() * reachedGoalOptions.length)];
  }

  // 4. If near target (80% - 99%): cheering finish line
  if (percentage >= 80) {
    const nearTargetOptions: NotificationMessage[] = [
      {
        title: '✨ Sắp tới đích rồi!',
        body: `Chỉ còn một chút nữa là chạm mốc ${targetMl} ml hôm nay rồi nè 💧`,
      },
      {
        title: '🔥 VỀ ĐÍCH THÔI!',
        body: 'Gần đạt mục tiêu ngày rồi đó, làm thêm một ly là hoàn hảo! ✨',
      },
    ];
    return nearTargetOptions[Math.floor(Math.random() * nearTargetOptions.length)];
  }

  // 5. If good progress (40% - 79%): active encouragement
  if (percentage >= 40) {
    const goodProgressOptions: NotificationMessage[] = [
      {
        title: '🔥 Đang làm rất tốt đó!',
        body: `Đã được ${currentMl} ml rồi! Uống thêm một ngụm để giữ đà nha 💧`,
      },
      {
        title: '💦 CHECK NƯỚC GIỮA GIỜ!',
        body: 'Một ngụm nước rồi quay lại chiến tiếp nào ✨',
      },
      {
        title: '💧 STOP SCROLLING!',
        body: 'Uống nước trước rồi lướt tiếp 👀💧',
      },
      {
        title: '⚡ TIẾP THÊM NĂNG LƯỢNG',
        body: 'Làm một ly nước mát cho não tỉnh táo chiến việc tiếp nào! 🧠',
      },
    ];
    return goodProgressOptions[Math.floor(Math.random() * goodProgressOptions.length)];
  }

  // 6. If low intake (< 40%): wake-up & action-motivating
  const lowIntakeOptions: NotificationMessage[] = [
    {
      title: '👀 Ê... nước đâu?',
      body: currentMl > 0
        ? `Hôm nay mới uống ${currentMl} ml thôi đó, đứng dậy làm ly nước đi bà 😭💧`
        : 'Từ sáng tới giờ chưa thấy giọt nước nào nha! Đứng dậy lấy nước lẹ 💧',
    },
    {
      title: '🚨 BREAKING NEWS: Bạn chưa uống nước!',
      body: 'Cơ thể đang réo tên bạn đó, đi làm một ngụm ngay đi 💧',
    },
    {
      title: '💧 Alooo, uống nước đi bà!',
      body: 'Đừng dán mắt vào màn hình nữa, ly nước đang chờ kìa 😭',
    },
    {
      title: '📢 THÔNG BÁO KHẨN',
      body: 'Ly nước đang cô đơn chờ bạn đó, đi uống lẹ nào! 💧',
    },
  ];

  // Mix with general trendy
  const combined = [...lowIntakeOptions, ...GENERAL_TRENDY_NOTIFICATIONS];
  return combined[Math.floor(Math.random() * combined.length)];
}

/**
 * Welcome back message when user returns after leaving for a while (> 20 mins)
 */
export const WELCOME_BACK_MESSAGES = [
  {
    title: '👀 Cuối cùng cũng quay lại!',
    body: 'Ly nước vẫn đang kiên nhẫn chờ bạn đó 💧',
  },
  {
    title: '✨ Welcome back!',
    body: 'Nhớ uống một ngụm nước lấy lại năng lượng nha 💧',
  },
  {
    title: '🥤 Thấy bạn rồi nha!',
    body: 'Tiện tay làm một ly nước mát luôn nè ✨',
  },
];
