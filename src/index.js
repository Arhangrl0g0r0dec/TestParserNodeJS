const puppeteer = require('puppeteer');
const proccess = require('process');
const fs = require('fs');

//Создаем папки для необходимых данных
fs.mkdirSync('./data', { recursive: true });
fs.mkdirSync('./data/textFile', { recursive: true });
fs.mkdirSync('./data/images', { recursive: true });

//Функция получения скриншота
const getPicture = async (link, region) => {
  if (!link || !region) {
    console.log('Получены не все параметры!!!');
    return;
  }

  try {
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized'],
      slowMo: 100,
    });

    const page = await browser.newPage();
    await page.setViewport(null);
    await page.goto(link);

    //Расскоментировать если браузер открывается не на весь экран и появляется layout войдите в X5ID
    //const closeBtn = await page.waitForSelector('#__next > div.Modal_root__kPoVQ.Modal_open__PaUmT > div > div > div.Content_root__7DKIP.Content_modal__gAOHB > button > svg > circle');
    //closeBtn.click();
    const addAddress = await page.waitForSelector(
      '#__next > div.FeatureAppLayoutBase_layout__0HSBo.FeatureAppLayoutBase_hideBannerMobile__97CUm.FeatureAppLayoutBase_hideBannerTablet__dCMoJ.FeatureAppLayoutBase_hideBannerDesktop__gPdf1 > div:nth-child(3) > div.UiHeaderHorizontalBase_secondRow__7b4Lk > div > div.UiHeaderHorizontalBase_region__2ODCG > div',
    );
    await addAddress.click();
    //Получаем элемент содержащий текст региона и при его наличии выполняем событие click()
    await page.evaluate((region) => {
      const elements = document.getElementsByTagName('li');
      Array.from(elements).forEach((element) => {
        if (element.textContent.includes(region)) {
          element.click();
        }
      });
    }, region);
    //Дожидаемся когда перейдем на страницу с контентом по товару
    await page.waitForSelector(
      '#__next > div.FeatureAppLayoutBase_layout__0HSBo.FeatureAppLayoutBase_hideBannerMobile__97CUm.FeatureAppLayoutBase_hideBannerTablet__dCMoJ.FeatureAppLayoutBase_hideBannerDesktop__gPdf1 > div:nth-child(3) > div.UiHeaderHorizontalBase_secondRow__7b4Lk > div > div.UiHeaderHorizontalBase_region__2ODCG > div',
    );
    //Делаем скриншот
    await page.screenshot({ path: 'data/images/product.png' });
    const dataProduct = await page.evaluate(async () => {
      let price = document.getElementsByClassName(
        'Price_price__QzA8L Price_size_XL__MHvC1 Price_role_discount__l_tpE',
      )[0];
      if (!price) {
        price = document.getElementsByClassName('Price_price__QzA8L Price_size_XL__MHvC1 Price_role_regular__X6X4D')[0];
        price ? (price = price.textContent) : (price = 'non');
      } else {
        price = price.textContent;
      }

      let priceOld = document.getElementsByClassName(
        'Price_price__QzA8L Price_size_XS__ESEhJ Price_role_old__r1uT1',
      )[0];
      priceOld ? (priceOld = priceOld.textContent) : (priceOld = 'non');

      let rating = document.getElementsByClassName('ActionsRow_stars__EKt42')[0];
      rating ? (rating = rating.textContent) : 'non';

      let reviewCount = document.getElementsByClassName('ActionsRow_reviews__AfSj_')[0];
      reviewCount ? (reviewCount = reviewCount.textContent) : 'non';

      return {
        price,
        priceOld,
        rating,
        reviewCount,
      };
    });

    let message;

    if (dataProduct && dataProduct.priceOld) {
      message = `
price=${dataProduct.price}
priceOld=${dataProduct.priceOld}
rating=${dataProduct.rating}
reviewCount=${dataProduct.reviewCount}
`;
    } else {
      message = `
price=${dataProduct.price}
priceOld=${dataProduct.priceOld}
rating=${dataProduct.rating}
reviewCount=${dataProduct.reviewCount}
`;
    }
    //Запись в файл data/textFile (постоянно перезаписывает данные)
    fs.writeFileSync('./data/textFile/product.txt', `${message}\r\n`);
    //Запись в файл data/textFile (дополняет файл)
    //fs.writeFileSync('./data/textFile/product.txt', `${message}\r\n`, {flag: 'a'});
    await browser.close();
  } catch (error) {
    console.log(error);
    return;
  }
};

const params = proccess.argv.slice(2);
getPicture(params[0], params[1]);
