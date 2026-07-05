import unittest
from unittest.mock import patch
from click.testing import CliRunner
from weather_cli_tool.src.cli import cli
from weather_cli_tool.src.models import WeatherData


class TestCLI(unittest.TestCase):
    def test_cli_help(self):
        runner = CliRunner()
        result = runner.invoke(cli, ['--help'])
        self.assertEqual(result.exit_code, 0)
        self.assertIn('Usage:', result.output)
        self.assertIn('Options:', result.output)

    @patch('weather_cli_tool.src.scraper.scrape_weather_data')
    @patch('weather_cli_tool.src.csv_exporter.export_to_csv')
    def test_cli_run(self, mock_export_to_csv, mock_scrape_weather_data):
        runner = CliRunner()
        mock_scrape_weather_data.return_value = [WeatherData('2024-01-01', 'New York', 'Sunny', 25)]
        result = runner.invoke(cli, ['run', '--location', 'New York', '--date', '2024-01-01'])
        self.assertEqual(result.exit_code, 0)
        mock_scrape_weather_data.assert_called_once_with('New York', '2024-01-01')
        mock_export_to_csv.assert_called_once_with([WeatherData('2024-01-01', 'New York', 'Sunny', 25)])

    @patch('weather_cli_tool.src.scraper.scrape_weather_data')
    @patch('weather_cli_tool.src.csv_exporter.export_to_csv')
    def test_cli_run_invalid_location(self, mock_export_to_csv, mock_scrape_weather_data):
        runner = CliRunner()
        mock_scrape_weather_data.side_effect = ValueError('Invalid location')
        result = runner.invoke(cli, ['run', '--location', 'Invalid Location', '--date', '2024-01-01'])
        self.assertEqual(result.exit_code, 1)
        self.assertIn('Invalid location', result.output)

if __name__ == '__main__':
    unittest.main()