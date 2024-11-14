const BASE_URL = "http://98.130.54.134:3000/";
const data = {
  PORT: 3000,

  APP_NAME: "Quick Mart",

  APP_URL: BASE_URL,

  MONGODB_CONNECTION_URL:
    "mongodb://ec2-98-130-37-171.ap-south-2.compute.amazonaws.com:27017/admin",

  FIREBASE_NOTIFICATION_SERVER_KEY:
    "AAAAwxnAHdw:APA91bFfq-vIlBkUjKCcdGuk0l1VlrLLTfcqOv-_kfft7q77t8pArr-lUBjbnMv4wg7gEUr2w1U41Gv2ywKSn1FDtO6K2ApBYTILt6vkqFC6d5x0MnsUT6gMEALOpWuqWmdEeCh0g-iI",

  keys: {
    secret: "4oXjuJ9c51OWqLx",
  },
  sessID: "ecom_4oXjuJ9c51OWqLxuser",

  USER_DEFAULT_IMAGE: BASE_URL + "images/users.png",
  DEFAULT_IMAGE: BASE_URL + "images/default_img.png",
  DEFAULT_LOGO: BASE_URL + "images/default/logo.png",
  DEFAULT_LOGO2: BASE_URL + "images/default/home_logo.png",
  DEFAULT_FAVICON: BASE_URL + "images/default/Fav.png",
  DEFAULT_AUTH_PAGE_IMAGE: BASE_URL + "images/default/auth_page_img.png",
  DEFAULT_EMAIL_TEMP_BG: BASE_URL + "images/default/email_temp_bg.jpg",
};
module.exports = data;
