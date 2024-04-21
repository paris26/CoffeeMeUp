import axios  from "axios";
import * as cheerio from 'cheerio' ;
import { extractCurrency, extractDescription, extractPrice, getAveragePrice } from "../utils";

export async function scrapeAmazonProduct(url: string){
    if(!url) return;

    //Bright data proxy
    // curl --proxy brd.superproxy.io:22225 --proxy-user brd-customer-hl_1586ec40-zone-coffeemeup:448u34c4m9va -k "http://lumtest.com/myip.json"
    
    const username = String(process.env.BRIGHT_DATA_USERNAME);
    const password = String(process.env.BRIGHT_DATA_PASSWORD);
    const port = 22225;
    const session_id =  (1000000 * Math.random()) | 0;
   
    const options = {
        auth:{
            username : `${username}-session-${session_id}`,
            password,
        },
        host : 'brd.superproxy.io',
        port,
        rejectUnauthorized: false
    }

    try {

        //fetch the product 
        const response = await axios.get(url, options);
        // console.log(response.data)
        
        const $ = cheerio.load(response.data);

        //Extract the product title 
        const title = $('#productTitle').text().trim();
        const currentPrice = extractPrice(
            $('.celwidget .a-section.a-spacing-small .a-lineitem.a-align-top .a-price.a-text-price.a-size-medium.apexPriceToPay .a-offscreen')
            // $('.priceToPay span.a-price-whole'),
            // $('a.size.base.a-color-price'),
            // $('.a-button-selected .a-color-base'),
            // $('.a-price.a-text-price.a-size-medium.apexPriceToPay'),
            // $('.a-offscreen')
        );
        
        const originalPrice = extractPrice(
            $('#priceblock_ourprice'),
            $('.a-price.a-text-price span.a-offscreen'),
            $('#listPrice'),
            $('#priceblock_dealprice'),
            $('.a-size-base.a-color-price')
          );

        const outOfStock = $('#availability span').text().trim().toLowerCase() === 'currently unavailable'

        const images = $('#imgBlkFront').attr('data-a-dynamic-image') || $('#landingImage').attr('data-a-dynamic-image') || '{}';
        
        const ImageUrls = Object.keys(JSON.parse(images));

       

        const currency = extractCurrency($('.a-price-symbol'))

        const discountRate = $('.savings-percentage').text().replace(/[-%]/g, "");

        const description = extractDescription($)
            
        
       
        // console.log({title, currentPrice, originalPrice, outOfStock, ImageUrls, currency, discountRate});
        // construct data object 
        const data = {
            url,
            currency: currency || '$',
            image : ImageUrls[0],
            title,
            currentPrice: Number(currentPrice) || Number(originalPrice),
            originalPrice: Number(originalPrice) || Number(currentPrice),
            priceHistory : [],
            discountRate : Number(discountRate),
            category : 'category',
            reviewsCount : 100,
            stars: 4.5,
            isOutOfStock : outOfStock,
            description,
            lowestPrice : Number(currentPrice) || Number(originalPrice),
            highestPrice : Number(originalPrice) || Number(currentPrice),
            averagePrice: Number(currentPrice) || Number(originalPrice)
        }
        
       return data; 

    } catch (error: any) {
        throw new Error(`Failed to scrape product : ${error.message}`);
    }
}