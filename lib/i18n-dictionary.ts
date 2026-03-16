export type Locale = "en" | "vi";

export const DEFAULT_LOCALE: Locale = "vi";
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
    bundleMeals: string;
    anchorFavorites: string;
    bundleMealBadge: string;
    anchorDishBadge: string;
    minimumLeadTime: string;
    bulkDiscountLabel: string;
    bulkDiscountNone: string;
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
    deliveryMethodPlaceholder: string;
    chooseFulfillmentError: string;
    delivery: string;
    pickup: string;
    deliveryAddressAutocomplete: string;
    deliveryAddressPlaceholder: string;
    deliveryAddressHint: string;
    addressSearching: string;
    addressLookupFailed: string;
    addressNoResults: string;
    addressSuggestionRequired: string;
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
    cashDisabledOver100: string;
    cashLimitNote: string;
    cashLimitError: string;
    orderNotes: string;
    orderWindowNote: string;
    turnstileToken: string;
    summaryTitle: string;
    itemsTitle: string;
    quantityLabel: string;
    cartSubtotal: string;
    bulkDiscount: string;
    earlyOrderDiscount: string;
    subtotalAfterDiscount: string;
    updatingEstimate: string;
    deliveryFee: string;
    distance: string;
    miles: string;
    tax: string;
    total: string;
    enterDetails: string;
    orderReceived: string;
    waitingForConfirmationTitle: string;
    waitingForConfirmationBody: string;
    orderNumberLabel: string;
    status: string;
    voteTitle: string;
    votePrompt: string;
    votePlaceholder: string;
    voteOptionBunBoHue: string;
    voteOptionComTam: string;
    voteOptionCaRiGa: string;
    voteOptionBanhMiChao: string;
    voteOptionOther: string;
    voteOtherLabel: string;
    voteOtherPlaceholder: string;
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
    footerLine:
      "Rau Om | 720 Orange Ave, Longwood, FL 32750 | Weekly batch cooking with Saturday delivery windows",
    footerAllergens: "Allergens",
    footerDeliveryFees: "Delivery Fees",
    footerFreshCook: "Batch-Cook Policy",
  },
  localeToggle: {
    ariaLabel: "Language switch",
    english: "English",
    vietnamese: "Vietnamese",
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
    eyebrow: "This Week's Batch Menu Pick",
    controlsAria: "Carousel controls",
    showDishPrefix: "Show",
  },
  dishGrid: {
    title: "Browse Dishes",
    subtitle:
      "Batch-cooking model: order Monday-Friday, we cook on Saturday, then deliver Saturday windows.",
    filterAria: "Filter dishes by dietary tags",
    all: "All",
    bundleMeals: "Bundle Meals",
    anchorFavorites: "Anchor Dishes",
    bundleMealBadge: "Bundle Meal",
    anchorDishBadge: "Anchor Dish",
    minimumLeadTime: "Minimum lead time",
    bulkDiscountLabel: "Bulk discount",
    bulkDiscountNone: "No bulk discount",
  },
  home: {
    trustTitle: "Weekly Batch-Cook Promise",
    trustBody:
      "Rau Om is a home-cook batch service. Customers place orders Monday through Friday, kitchen prep happens Saturday, and delivery runs Saturday windows.",
    trustBulletLeadTime: "Early-order incentives: 10% off Monday, 5% off Tuesday/Wednesday",
    trustBulletDelivery: "Anchor dishes stay on the menu while rotating dishes change weekly",
    trustBulletPayment: "Bundle meals are available for families and weekly meal prep",
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
      "Weekly batch policy applies: orders open Monday-Friday and are fulfilled on Saturday. Early-order discounts are applied automatically based on order day.",
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
    deliveryMethodPlaceholder: "Select delivery method",
    chooseFulfillmentError: "Please choose delivery or pickup.",
    delivery: "Delivery",
    pickup: "Pickup",
    deliveryAddressAutocomplete: "Delivery address",
    deliveryAddressPlaceholder: "Start typing your address...",
    deliveryAddressHint: "Pick an address from suggestions to calculate delivery fee.",
    addressSearching: "Searching addresses...",
    addressLookupFailed: "Address suggestions are temporarily unavailable.",
    addressNoResults: "No matching addresses found. Try a more complete street, city, and state.",
    addressSuggestionRequired: "Please select a delivery address from suggestions.",
    address1: "Address line 1",
    address2: "Address line 2",
    city: "City",
    state: "State",
    zip: "ZIP",
    slot: "Fulfillment slot",
    fulfillmentDate: "Fulfillment date",
    slotPlaceholder: "Select a slot",
    noSlotsForDate: "No eligible slots right now. Orders open Monday-Friday for Saturday fulfillment.",
    paymentNotesTitle: "Payment and Notes",
    paymentMethod: "Payment method",
    cash: "Cash",
    zelle: "Zelle",
    venmo: "Venmo",
    cashDisabledOver100: "disabled for orders over $100",
    cashLimitNote: "Orders above $100 must be paid with Zelle or Venmo.",
    cashLimitError: "Orders above $100 must use Zelle or Venmo.",
    orderNotes: "Order notes",
    orderWindowNote:
      "Ordering is open Monday-Friday. Kitchen cooks in one Saturday batch and delivers Saturday windows.",
    turnstileToken: "Turnstile token (required only when Turnstile secret is configured)",
    summaryTitle: "Estimated total",
    itemsTitle: "Order items",
    quantityLabel: "Qty",
    cartSubtotal: "Cart subtotal",
    bulkDiscount: "Bulk discount",
    earlyOrderDiscount: "Early-order discount",
    subtotalAfterDiscount: "Subtotal after discount",
    updatingEstimate: "Updating estimate...",
    deliveryFee: "Delivery fee",
    distance: "Distance",
    miles: "miles",
    tax: "Tax",
    total: "Final total",
    enterDetails: "Enter fulfillment details to calculate total.",
    orderReceived: "Order received",
    waitingForConfirmationTitle: "Waiting for confirmation",
    waitingForConfirmationBody: "Your order was submitted. We will confirm your order shortly.",
    orderNumberLabel: "Order number",
    status: "Status",
    voteTitle: "Vote for Next Week",
    votePrompt: "Choose a dish you want on next week's rotating menu",
    votePlaceholder: "No vote selected",
    voteOptionBunBoHue: "Bun Bo Hue",
    voteOptionComTam: "Com Tam Suon Nuong",
    voteOptionCaRiGa: "Ca Ri Ga",
    voteOptionBanhMiChao: "Banh Mi Chao",
    voteOptionOther: "Other (type your vote)",
    voteOtherLabel: "Your custom vote",
    voteOtherPlaceholder: "Example: Bun Rieu or Mi Quang",
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
    step1: "Browse anchor dishes, rotating weekly dishes, and bundle meals.",
    step2: "Place your order Monday through Friday and choose your Saturday fulfillment slot.",
    step3: "Checkout applies bulk rules, early-order discount, delivery fee, and tax estimate.",
    step4: "Submit payment details and optionally vote for next week's rotating dish.",
    step5: "Kitchen batch-cooks on Saturday, then deliveries go out in Saturday windows.",
    note: "Early-order discount policy: Monday 10%, Tuesday/Wednesday 5%, Thursday/Friday 0%.",
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
    title: "Weekly Batch-Cooking Policy",
    paragraph:
      "Rau Om runs a weekly home-kitchen batch cycle instead of daily cook-to-order dispatch.",
    bullet1: "Order window: Monday through Friday",
    bullet2: "Kitchen cook day: Saturday",
    bullet3: "Delivery window: Saturday slots only",
    closing:
      "This rhythm helps reduce kitchen stress, improves prep planning, and keeps quality consistent.",
  },
};

const VI_MESSAGES: SiteMessages = {
  layout: {
    navHome: "Trang chủ",
    navHowOrdering: "Cách đặt món",
    navCheckout: "Thanh toán",
    mainNavigationAria: "Điều hướng chính",
    brandAria: "Trang chủ Rau Om",
    footerLine:
      "Rau Om | 720 Orange Ave, Longwood, FL 32750 | Bếp gia đình nấu theo đợt, giao hàng vào khung giờ thứ Bảy",
    footerAllergens: "Cảnh báo dị ứng",
    footerDeliveryFees: "Phí giao hàng",
    footerFreshCook: "Chính sách nấu theo đợt",
  },
  localeToggle: {
    ariaLabel: "Chuyển ngôn ngữ",
    english: "English",
    vietnamese: "Vietnamese",
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
    eyebrow: "Món tiêu biểu trong thực đơn nấu theo đợt tuần này",
    controlsAria: "Điều khiển trình chiếu",
    showDishPrefix: "Hiển thị",
  },
  dishGrid: {
    title: "Danh sách món",
    subtitle:
      "Mô hình nấu theo đợt: đặt món từ thứ Hai đến thứ Sáu, bếp nấu thứ Bảy và giao trong các khung giờ thứ Bảy.",
    filterAria: "Lọc món theo nhãn chế độ ăn",
    all: "Tất cả",
    bundleMeals: "Combo tuần",
    anchorFavorites: "Món cố định",
    bundleMealBadge: "Món combo",
    anchorDishBadge: "Món cố định",
    minimumLeadTime: "Thời gian đặt trước tối thiểu",
    bulkDiscountLabel: "Ưu đãi số lượng",
    bulkDiscountNone: "Chưa có ưu đãi số lượng",
  },
  home: {
    trustTitle: "Cam kết nấu theo đợt hằng tuần",
    trustBody:
      "Rau Om vận hành như dịch vụ bếp gia đình nấu theo đợt. Khách đặt món từ thứ Hai đến thứ Sáu, bếp nấu thứ Bảy và giao trong ngày thứ Bảy.",
    trustBulletLeadTime: "Ưu đãi đặt sớm: giảm 10% vào thứ Hai, giảm 5% vào thứ Ba/Thứ Tư",
    trustBulletDelivery: "Giữ một số món cố định, đồng thời xoay vòng món mới mỗi tuần",
    trustBulletPayment: "Có combo bữa ăn để giảm tải nấu nướng trong tuần",
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
      "Áp dụng mô hình nấu theo đợt hằng tuần: đặt món từ thứ Hai đến thứ Sáu và nhận/giao vào thứ Bảy. Ưu đãi đặt sớm sẽ tự động tính theo ngày đặt.",
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
    deliveryMethodPlaceholder: "Chọn hình thức nhận món",
    chooseFulfillmentError: "Vui lòng chọn giao hàng hoặc nhận tại cửa hàng.",
    delivery: "Giao hàng",
    pickup: "Nhận tại cửa hàng",
    deliveryAddressAutocomplete: "Địa chỉ giao hàng",
    deliveryAddressPlaceholder: "Bắt đầu nhập địa chỉ...",
    deliveryAddressHint: "Vui lòng chọn địa chỉ từ gợi ý để tính phí giao hàng.",
    addressSearching: "Đang tìm địa chỉ...",
    addressLookupFailed: "Hiện không thể lấy gợi ý địa chỉ.",
    addressNoResults: "Không tìm thấy địa chỉ phù hợp. Vui lòng nhập đầy đủ số nhà, đường, thành phố và tiểu bang.",
    addressSuggestionRequired: "Vui lòng chọn địa chỉ giao hàng từ danh sách gợi ý.",
    address1: "Địa chỉ dòng 1",
    address2: "Địa chỉ dòng 2",
    city: "Thành phố",
    state: "Tiểu bang",
    zip: "Mã ZIP",
    slot: "Khung giờ nhận món",
    fulfillmentDate: "Ngày nhận món",
    slotPlaceholder: "Chọn khung giờ",
    noSlotsForDate: "Hiện không có khung giờ hợp lệ. Chỉ nhận đơn thứ Hai-thứ Sáu cho lịch giao/nhận thứ Bảy.",
    paymentNotesTitle: "Thanh toán và ghi chú",
    paymentMethod: "Phương thức thanh toán",
    cash: "Tiền mặt",
    zelle: "Zelle",
    venmo: "Venmo",
    cashDisabledOver100: "không áp dụng cho đơn trên $100",
    cashLimitNote: "Đơn trên $100 phải thanh toán bằng Zelle hoặc Venmo.",
    cashLimitError: "Đơn trên $100 phải dùng Zelle hoặc Venmo.",
    orderNotes: "Ghi chú đơn hàng",
    orderWindowNote:
      "Nhận đơn từ thứ Hai đến thứ Sáu. Bếp nấu theo đợt vào thứ Bảy và giao trong các khung giờ thứ Bảy.",
    turnstileToken: "Mã Turnstile (chỉ cần khi đã cấu hình Turnstile secret)",
    summaryTitle: "Tổng tạm tính",
    itemsTitle: "Món trong đơn",
    quantityLabel: "SL",
    cartSubtotal: "Tạm tính giỏ hàng",
    bulkDiscount: "Giảm giá số lượng",
    earlyOrderDiscount: "Ưu đãi đặt sớm",
    subtotalAfterDiscount: "Tạm tính sau giảm giá",
    updatingEstimate: "Đang cập nhật tạm tính...",
    deliveryFee: "Phí giao hàng",
    distance: "Khoảng cách",
    miles: "mile",
    tax: "Thuế",
    total: "Tổng cộng",
    enterDetails: "Nhập thông tin nhận món để tính tổng.",
    orderReceived: "Đã nhận đơn",
    waitingForConfirmationTitle: "Đang chờ xác nhận",
    waitingForConfirmationBody: "Đơn của bạn đã được gửi. Chúng tôi sẽ xác nhận trong thời gian sớm nhất.",
    orderNumberLabel: "Mã đơn hàng",
    status: "Trạng thái",
    voteTitle: "Bình chọn món tuần tới",
    votePrompt: "Chọn món bạn muốn có trong thực đơn xoay vòng tuần sau",
    votePlaceholder: "Chưa chọn bình chọn",
    voteOptionBunBoHue: "Bún bò Huế",
    voteOptionComTam: "Cơm tấm sườn nướng",
    voteOptionCaRiGa: "Cà ri gà",
    voteOptionBanhMiChao: "Bánh mì chảo",
    voteOptionOther: "Món khác (tự nhập)",
    voteOtherLabel: "Món bạn đề xuất",
    voteOtherPlaceholder: "Ví dụ: Bún riêu hoặc Mì Quảng",
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
    step1: "Xem món cố định, món xoay vòng và các combo tuần rồi thêm vào giỏ hàng.",
    step2: "Đặt món trong khoảng thứ Hai đến thứ Sáu và chọn khung giờ giao/nhận thứ Bảy.",
    step3: "Hệ thống tính ưu đãi số lượng, ưu đãi đặt sớm, phí giao hàng và thuế.",
    step4: "Gửi đơn, chọn phương thức thanh toán và có thể bình chọn món cho tuần sau.",
    step5: "Bếp nấu theo đợt vào thứ Bảy, sau đó giao trong các khung giờ thứ Bảy.",
    note: "Chính sách ưu đãi đặt sớm: thứ Hai 10%, thứ Ba/Thứ Tư 5%, thứ Năm/Thứ Sáu 0%.",
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
    title: "Chính sách nấu theo đợt hằng tuần",
    paragraph:
      "Rau Om vận hành theo nhịp bếp gia đình nấu theo đợt mỗi tuần thay vì nấu giao ngay hằng ngày.",
    bullet1: "Thời gian nhận đơn: thứ Hai đến thứ Sáu",
    bullet2: "Ngày nấu chính của bếp: thứ Bảy",
    bullet3: "Khung giao hàng: chỉ trong ngày thứ Bảy",
    closing:
      "Nhịp vận hành này giúp giảm áp lực cho bếp, chuẩn bị nguyên liệu tốt hơn và giữ chất lượng ổn định.",
  },
};

const MESSAGES: Record<Locale, SiteMessages> = {
  en: EN_MESSAGES,
  vi: VI_MESSAGES,
};

export function normalizeLocale(value?: string | null): Locale {
  if (value === "en" || value === "vi") {
    return value;
  }
  return DEFAULT_LOCALE;
}

export function getMessages(locale: Locale): SiteMessages {
  return MESSAGES[normalizeLocale(locale)];
}
