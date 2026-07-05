import unittest
from unittest.mock import patch
from bs4 import BeautifulSoup
from weather_cli_tool.src.scraper import Scraper
from weather_cli_tool.src.models import WeatherData

class TestScraper(unittest.TestCase):
    def setUp(self):
        self.scraper = Scraper()

    @patch('requests.get')
    def test_fetch_weather_data(self, mock_get):
        mock_response = '<html><body><p>Weather Data</p></body></html>'
        mock_get.return_value.text = mock_response
        response = self.scraper.fetch_weather_data('https://example.com/weather')
        self.assertEqual(response, mock_response)

    @patch('requests.get')
    def test_parse_weather_data(self, mock_get):
        mock_response = '<html><body><p>Temperature: 25°C</p><p>Humidity: 60%</p></body></html>'
        mock_get.return_value.text = mock_response
        weather_data = self.scraper.parse_weather_data(mock_response)
        self.assertIsInstance(weather_data, WeatherData)
        self.assertEqual(weather_data.temperature, 25)
        self.assertEqual(weather_data.humidity, 60)

    @patch('requests.get')
    def test_scrape_weather_data(self, mock_get):
        mock_response = '<html><body><p>Temperature: 25°C</p><p>Humidity: 60%</p></body></html>'
        mock_get.return_value.text = mock_response
        weather_data = self.scraper.scrape_weather_data('https://example.com/weather')
        self.assertIsInstance(weather_data, WeatherData)
        self.assertEqual(weather_data.temperature, 25)
        self.assertEqual(weather_data.humidity, 60)

if __name__ == '__main__':
    unittest.main()