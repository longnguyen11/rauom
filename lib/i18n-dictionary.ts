export type Locale = "en" | "vi";

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE_NAME = "rauom_locale";

export interface SiteMessages {
  layout: {
    navHome: string;
    navHowOrdering: string;
    navCheckout: string;
    mainNavigationAria: string;
    brandAria: string;
    footerLine: string;
    footerAllergens: string;
    footerDeliveryFees: string;
    footerFreshCook: string;
  };
  localeToggle: {
    ariaLabel: string;
    english: string;
    vietnamese: string;
  };
  common: {
    viewDetails: string;
    addToCart: string;
    added: string;
    daySuffix: string;
    each: string;
  };
  cart: {
    buttonLabel: string;
    openAria: string;
    drawerAria: string;
    title: string;
    close: string;
    empty: string;
    remove: string;
    subtotal: string;
    checkout: string;
    decreaseQtyPrefix: string;
    increaseQtyPrefix: string;
  };
  hero: {
    sectionAria: string;
    eyebrow: string;
    controlsAria: string;
    showDishPrefix: string;
  };
  dishGrid: {
    title: string;
    subtitle: string;
    filterAria: string;
    all: string;
    minimumLeadTime: string;
  };
  home: {
    trustTitle: string;
    trustBody: string;
    trustBulletLeadTime: string;
    trustBulletDelivery: string;
    trustBulletPayment: string;
    readFlow: string;
  };
  newsletter: {
    title: string;
    subtitle: string;
    inputPlaceholder: string;
    inputAria: string;
    join: string;
    submitting: string;
    defaultSuccess: string;
    defaultError: string;
  };
  checkoutPage: {
    title: string;
    intro: string;
  };
  checkout: {
    empty: string;
    chooseSlotError: string;
    invalidEmail: string;
    invalidPhone: string;
    estimateFailed: string;
    orderFailed: string;
    contactTitle: string;
    name: string;
    email: string;
    phone: string;
    fulfillmentTitle: string;
    fulfillmentAria: string;
    delivery: string;
    pickup: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    zip: string;
    slot: string;
    fulfillmentDate: string;
    slotPlaceholder: string;
    noSlotsForDate: string;
    paymentNotesTitle: string;
    paymentMethod: string;
    cash: string;
    zelle: string;
    venmo: string;
    orderNotes: string;
    turnstileToken: string;
    summaryTitle: string;
    itemsTitle: string;
    quantityLabel: string;
    cartSubtotal: string;
    updatingEstimate: string;
    deliveryFee: string;
    distance: string;
    miles: string;
    tax: string;
    total: string;
    enterDetails: string;
    orderReceived: string;
    status: string;
    submit: string;
    submitting: string;
  };
  archive: {
    title: string;
    subtitle: string;
    empty: string;
    viewArchivedDetails: string;
  };
  dishPage: {
    backToDishes: string;
    leadTime: string;
    dietaryTags: string;
    ingredients: string;
    allergenSuffix: string;
    nutritionOptional: string;
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
    sodium: string;
    na: string;
  };
  howOrdering: {
    title: string;
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    step5: string;
    note: string;
  };
  allergens: {
    title: string;
    paragraph1: string;
    paragraph2: string;
  };
  deliveryFees: {
    title: string;
    origin: string;
    cutoff: string;
    tier1: string;
    tier2: string;
    rounding: string;
    pickupFallback: string;
  };
  freshCook: {
    title: string;
    paragraph: string;
    bullet1: string;
    bullet2: string;
    bullet3: string;
    closing: string;
  };
}

const EN_MESSAGES: SiteMessages = {
  layout: {
    navHome: "Home",
    navHowOrdering: "How Ordering Works",
    navCheckout: "Checkout",
    mainNavigationAria: "Main navigation",
    brandAria: "Rau Om homepage",
    footerLine: "Rau Om | 720 Orange Ave, Longwood, FL 32750 | Delivery and pickup in Orlando area",
    footerAllergens: "Allergens",
    footerDeliveryFees: "Delivery Fees",
    footerFreshCook: "Fresh-Cook Policy",
  },
  localeToggle: {
    ariaLabel: "Language switch",
    english: "EN",
    vietnamese: "VI",
  },
  common: {
    viewDetails: "View details",
    addToCart: "Add to Cart",
    added: "Added",
    daySuffix: "day(s)",
    each: "each",
  },
  cart: {
    buttonLabel: "Cart",
    openAria: "Open cart",
    drawerAria: "Shopping cart",
    title: "Your Cart",
    close: "Close",
    empty: "No dishes selected yet.",
    remove: "Remove",
    subtotal: "Subtotal",
    checkout: "Checkout",
    decreaseQtyPrefix: "Decrease quantity for",
    increaseQtyPrefix: "Increase quantity for",
  },
  hero: {
    sectionAria: "Featured dishes",
    eyebrow: "This Week's Featured Dish",
    controlsAria: "Carousel controls",
    showDishPrefix: "Show",
  },
  dishGrid: {
    title: "Browse Dishes",
    subtitle: "Fresh-cook model: kitchen starts after order confirmation.",
    filterAria: "Filter dishes by dietary tags",
    all: "All",
    minimumLeadTime: "Minimum lead time",
  },
  home: {
    trustTitle: "Trust and Freshness",
    trustBody:
      "Every order is prepared after confirmation. Rau Om does not batch-cook for instant dispatch, so quality and timing stay consistent.",
    trustBulletLeadTime: "Lead-time protected scheduling (1-3 days by dish complexity)",
    trustBulletDelivery: "Delivery range checks with pickup fallback",
    trustBulletPayment: "Manual payment support at launch: cash, Zelle, Venmo",
    readFlow: "Read the full ordering flow",
  },
  newsletter: {
    title: "Get weekly featured dishes",
    subtitle: "Double opt-in enabled. One-click unsubscribe in every email.",
    inputPlaceholder: "you@example.com",
    inputAria: "Email address",
    join: "Join newsletter",
    submitting: "Submitting...",
    defaultSuccess: "Check your inbox to confirm subscription.",
    defaultError: "Subscription failed.",
  },
  checkoutPage: {
    title: "Checkout",
    intro:
      "Fresh-cook policy applies: all orders are prepared after confirmation. Slot eligibility enforces dish lead-time and payment confirmation buffer.",
  },
  checkout: {
    empty: "Your cart is empty. Add dishes first.",
    chooseSlotError: "Please choose a fulfillment slot.",
    invalidEmail: "Please enter a valid email address.",
    invalidPhone: "Please enter a valid phone number in (xxx) xxx-xxxx format.",
    estimateFailed: "Could not estimate this order.",
    orderFailed: "Order submission failed. Please retry.",
    contactTitle: "Contact",
    name: "Name",
    email: "Email",
    phone: "Phone",
    fulfillmentTitle: "Fulfillment",
    fulfillmentAria: "Choose delivery or pickup",
    delivery: "Delivery",
    pickup: "Pickup",
    address1: "Address line 1",
    address2: "Address line 2",
    city: "City",
    state: "State",
    zip: "ZIP",
    slot: "Fulfillment slot",
    fulfillmentDate: "Fulfillment date",
    slotPlaceholder: "Select a slot",
    noSlotsForDate: "No available slots for the selected date.",
    paymentNotesTitle: "Payment and Notes",
    paymentMethod: "Payment method",
    cash: "Cash",
    zelle: "Zelle",
    venmo: "Venmo",
    orderNotes: "Order notes",
    turnstileToken: "Turnstile token (required only when Turnstile secret is configured)",
    summaryTitle: "Estimated total",
    itemsTitle: "Order items",
    quantityLabel: "Qty",
    cartSubtotal: "Cart subtotal",
    updatingEstimate: "Updating estimate...",
    deliveryFee: "Delivery fee",
    distance: "Distance",
    miles: "miles",
    tax: "Tax",
    total: "Final total",
    enterDetails: "Enter fulfillment details to calculate total.",
    orderReceived: "Order received",
    status: "Status",
    submit: "Submit order",
    submitting: "Submitting...",
  },
  archive: {
    title: "Archive",
    subtitle:
      "Archived dishes stay searchable so returning customers can request repeats in future rotations.",
    empty: "No archived dishes yet.",
    viewArchivedDetails: "View archived details",
  },
  dishPage: {
    backToDishes: "Back to dishes",
    leadTime: "Lead time",
    dietaryTags: "Dietary tags",
    ingredients: "Ingredients",
    allergenSuffix: "(allergen)",
    nutritionOptional: "Nutrition (optional)",
    calories: "Calories",
    protein: "Protein",
    carbs: "Carbs",
    fat: "Fat",
    sodium: "Sodium",
    na: "N/A",
  },
  howOrdering: {
    title: "How Ordering Works",
    step1: "Browse dishes and add items to cart.",
    step2: "Select delivery or pickup and choose an eligible timeslot.",
    step3: "Checkout validates lead-time, capacity, distance, and tax estimate.",
    step4: "Submit with manual payment method (cash, Zelle, Venmo).",
    step5: "Order enters pending confirmation, then kitchen begins after confirmation.",
    note: "Lead-time defaults to at least 1 day, and some dishes require 2-3 days.",
  },
  allergens: {
    title: "Allergens Disclosure",
    paragraph1:
      "Rau Om dishes may include or be prepared near fish, shellfish, soy, sesame, peanuts, tree nuts, gluten, eggs, and dairy.",
    paragraph2:
      "Ingredient lists are provided per dish, but cross-contact is possible in a home-kitchen workflow. Contact us before ordering if you have severe allergies.",
  },
  deliveryFees: {
    title: "Delivery Area and Fees",
    origin: "Origin: 720 Orange Ave, Longwood, FL 32750.",
    cutoff: "Driving distance cutoff: 30.0 miles (delivery unavailable beyond that).",
    tier1: "0-10 miles: base $4.00 plus $0.90 per mile",
    tier2: "10-30 miles: $13.00 plus $0.65 per mile beyond 10",
    rounding: "Final fee rounds to nearest $0.50",
    pickupFallback: "If delivery is unavailable, pickup remains available at checkout.",
  },
  freshCook: {
    title: "Fresh-Cook Lead-Time Policy",
    paragraph:
      "Rau Om cooks dishes after order confirmation. We do not batch-cook for instant dispatch.",
    bullet1: "Default minimum lead-time: 1 day",
    bullet2: "Some dishes require 2 or 3 days",
    bullet3: "Manual payment confirmation must be completed before fulfillment window",
    closing: "This policy protects ingredient quality, food safety, and kitchen timing.",
  },
};

const VI_MESSAGES: SiteMessages = {
  layout: {
    navHome: "Trang chủ",
    navHowOrdering: "Cách đặt món",
    navCheckout: "Thanh toán",
    mainNavigationAria: "Điều hướng chính",
    brandAria: "Trang chủ Rau Om",
    footerLine: "Rau Om | 720 Orange Ave, Longwood, FL 32750 | Giao hàng và nhận tại cửa hàng khu vực Orlando",
    footerAllergens: "Cảnh báo dị ứng",
    footerDeliveryFees: "Phí giao hàng",
    footerFreshCook: "Chính sách nấu tươi",
  },
  localeToggle: {
    ariaLabel: "Chuyển ngôn ngữ",
    english: "EN",
    vietnamese: "VI",
  },
  common: {
    viewDetails: "Xem chi tiết",
    addToCart: "Thêm vào giỏ",
    added: "Đã thêm",
    daySuffix: "ngày",
    each: "mỗi phần",
  },
  cart: {
    buttonLabel: "Giỏ hàng",
    openAria: "Mở giỏ hàng",
    drawerAria: "Giỏ hàng",
    title: "Giỏ hàng của bạn",
    close: "Đóng",
    empty: "Chưa có món nào trong giỏ.",
    remove: "Xóa",
    subtotal: "Tạm tính",
    checkout: "Thanh toán",
    decreaseQtyPrefix: "Giảm số lượng cho",
    increaseQtyPrefix: "Tăng số lượng cho",
  },
  hero: {
    sectionAria: "Món nổi bật",
    eyebrow: "Món nổi bật tuần này",
    controlsAria: "Điều khiển trình chiếu",
    showDishPrefix: "Hiển thị",
  },
  dishGrid: {
    title: "Danh sách món",
    subtitle: "Mô hình nấu tươi: bếp chỉ bắt đầu sau khi xác nhận đơn.",
    filterAria: "Lọc món theo nhãn chế độ ăn",
    all: "Tất cả",
    minimumLeadTime: "Thời gian đặt trước tối thiểu",
  },
  home: {
    trustTitle: "Cam kết chất lượng",
    trustBody:
      "Mỗi đơn đều được nấu sau khi xác nhận. Rau Om không nấu hàng loạt để giao ngay, nhằm giữ chất lượng và thời điểm phục vụ tốt nhất.",
    trustBulletLeadTime: "Lịch đặt trước theo độ phức tạp món (1-3 ngày)",
    trustBulletDelivery: "Kiểm tra phạm vi giao hàng, ngoài vùng sẽ chuyển sang nhận tại cửa hàng",
    trustBulletPayment: "Hỗ trợ thanh toán thủ công khi mở bán: tiền mặt, Zelle, Venmo",
    readFlow: "Xem quy trình đặt món đầy đủ",
  },
  newsletter: {
    title: "Nhận cập nhật món nổi bật hằng tuần",
    subtitle: "Có double opt-in. Có liên kết hủy đăng ký trong mọi email.",
    inputPlaceholder: "ban@example.com",
    inputAria: "Địa chỉ email",
    join: "Đăng ký",
    submitting: "Đang gửi...",
    defaultSuccess: "Vui lòng kiểm tra email để xác nhận đăng ký.",
    defaultError: "Đăng ký thất bại.",
  },
  checkoutPage: {
    title: "Thanh toán",
    intro:
      "Chính sách nấu tươi được áp dụng: tất cả đơn được nấu sau khi xác nhận. Khung giờ hợp lệ sẽ theo thời gian đặt trước và thời gian đệm xác nhận thanh toán.",
  },
  checkout: {
    empty: "Giỏ hàng đang trống. Hãy thêm món trước.",
    chooseSlotError: "Vui lòng chọn khung giờ nhận món.",
    invalidEmail: "Vui lòng nhập địa chỉ email hợp lệ.",
    invalidPhone: "Vui lòng nhập số điện thoại đúng định dạng (xxx) xxx-xxxx.",
    estimateFailed: "Không thể tính tạm tính đơn hàng.",
    orderFailed: "Gửi đơn thất bại. Vui lòng thử lại.",
    contactTitle: "Thông tin liên hệ",
    name: "Họ tên",
    email: "Email",
    phone: "Số điện thoại",
    fulfillmentTitle: "Hình thức nhận món",
    fulfillmentAria: "Chọn giao hàng hoặc nhận tại cửa hàng",
    delivery: "Giao hàng",
    pickup: "Nhận tại cửa hàng",
    address1: "Địa chỉ dòng 1",
    address2: "Địa chỉ dòng 2",
    city: "Thành phố",
    state: "Tiểu bang",
    zip: "Mã ZIP",
    slot: "Khung giờ nhận món",
    fulfillmentDate: "Ngày nhận món",
    slotPlaceholder: "Chọn khung giờ",
    noSlotsForDate: "Không có khung giờ phù hợp cho ngày đã chọn.",
    paymentNotesTitle: "Thanh toán và ghi chú",
    paymentMethod: "Phương thức thanh toán",
    cash: "Tiền mặt",
    zelle: "Zelle",
    venmo: "Venmo",
    orderNotes: "Ghi chú đơn hàng",
    turnstileToken: "Mã Turnstile (chỉ cần khi đã cấu hình Turnstile secret)",
    summaryTitle: "Tổng tạm tính",
    itemsTitle: "Món trong đơn",
    quantityLabel: "SL",
    cartSubtotal: "Tạm tính giỏ hàng",
    updatingEstimate: "Đang cập nhật tạm tính...",
    deliveryFee: "Phí giao hàng",
    distance: "Khoảng cách",
    miles: "mile",
    tax: "Thuế",
    total: "Tổng cộng",
    enterDetails: "Nhập thông tin nhận món để tính tổng.",
    orderReceived: "Đã nhận đơn",
    status: "Trạng thái",
    submit: "Gửi đơn",
    submitting: "Đang gửi...",
  },
  archive: {
    title: "Món lưu trữ",
    subtitle:
      "Món lưu trữ vẫn có thể tìm kiếm để khách quen yêu cầu nấu lại trong các đợt mở bán tiếp theo.",
    empty: "Chưa có món lưu trữ.",
    viewArchivedDetails: "Xem chi tiết món lưu trữ",
  },
  dishPage: {
    backToDishes: "Quay lại danh sách món",
    leadTime: "Thời gian đặt trước",
    dietaryTags: "Nhãn chế độ ăn",
    ingredients: "Thành phần",
    allergenSuffix: "(dị ứng)",
    nutritionOptional: "Dinh dưỡng (tùy chọn)",
    calories: "Calo",
    protein: "Chất đạm",
    carbs: "Tinh bột",
    fat: "Chất béo",
    sodium: "Natri",
    na: "Không có",
  },
  howOrdering: {
    title: "Cách đặt món",
    step1: "Xem món và thêm vào giỏ hàng.",
    step2: "Chọn giao hàng hoặc nhận tại cửa hàng và chọn khung giờ hợp lệ.",
    step3: "Hệ thống kiểm tra thời gian đặt trước, sức chứa, khoảng cách và thuế.",
    step4: "Gửi đơn với phương thức thanh toán thủ công (tiền mặt, Zelle, Venmo).",
    step5: "Đơn vào trạng thái chờ xác nhận, bếp bắt đầu sau khi xác nhận.",
    note: "Mặc định đặt trước tối thiểu 1 ngày, một số món cần 2-3 ngày.",
  },
  allergens: {
    title: "Cảnh báo dị ứng",
    paragraph1:
      "Món Rau Om có thể chứa hoặc được chế biến gần cá, hải sản, đậu nành, mè, đậu phộng, các loại hạt, gluten, trứng và sữa.",
    paragraph2:
      "Danh sách thành phần có trên từng món, nhưng vẫn có khả năng nhiễm chéo trong mô hình bếp gia đình. Vui lòng liên hệ trước nếu bạn dị ứng nặng.",
  },
  deliveryFees: {
    title: "Khu vực và phí giao hàng",
    origin: "Điểm xuất phát: 720 Orange Ave, Longwood, FL 32750.",
    cutoff: "Giới hạn khoảng cách lái xe: 30.0 mile (vượt quá sẽ không giao hàng).",
    tier1: "0-10 mile: phí nền $4.00 + $0.90 mỗi mile",
    tier2: "10-30 mile: $13.00 + $0.65 mỗi mile vượt quá 10",
    rounding: "Phí cuối được làm tròn đến $0.50 gần nhất",
    pickupFallback: "Nếu không giao được, bạn vẫn có thể nhận tại cửa hàng.",
  },
  freshCook: {
    title: "Chính sách nấu tươi và đặt trước",
    paragraph:
      "Rau Om nấu món sau khi xác nhận đơn. Chúng tôi không nấu hàng loạt để giao ngay.",
    bullet1: "Đặt trước tối thiểu mặc định: 1 ngày",
    bullet2: "Một số món cần 2 hoặc 3 ngày",
    bullet3: "Cần xác nhận thanh toán trước khung giờ phục vụ",
    closing: "Chính sách này giúp bảo đảm chất lượng nguyên liệu, an toàn thực phẩm và nhịp bếp.",
  },
};

const MESSAGES: Record<Locale, SiteMessages> = {
  en: EN_MESSAGES,
  vi: VI_MESSAGES,
};

export function normalizeLocale(value?: string | null): Locale {
  if (value === "vi") {
    return "vi";
  }
  return DEFAULT_LOCALE;
}

export function getMessages(locale: Locale): SiteMessages {
  return MESSAGES[normalizeLocale(locale)];
}
