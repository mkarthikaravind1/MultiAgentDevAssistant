import logging
import requests
from bs4 import BeautifulSoup

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class WeatherScraper:
    def __init__(self, url):
        self.url = url
        self.weather_data = []

    def scrape_weather_data(self):
        try:
            # Send a GET request to the weather data source
            response = requests.get(self.url)
            response.raise_for_status()  # Raise an exception for HTTP errors

            # Parse the HTML content using BeautifulSoup
            soup = BeautifulSoup(response.text, 'html.parser')

            # Find the weather data elements on the webpage
            weather_elements = soup.find_all('div', class_='weather-data')

            # Extract the weather data from the elements
            for element in weather_elements:
                weather_data = {
                    'date': element.find('span', class_='date').text.strip(),
                    'temperature': element.find('span', class_='temperature').text.strip(),
                    'condition': element.find('span', class_='condition').text.strip()
                }
                self.weather_data.append(weather_data)

            logging.info('Weather data scraped successfully')
        except requests.exceptions.RequestException as e:
            logging.error(f'Error scraping weather data: {e}')
        except Exception as e:
            logging.error(f'An error occurred: {e}')

    def get_weather_data(self):
        return self.weather_data
