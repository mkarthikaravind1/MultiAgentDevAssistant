import unittest
from unittest.mock import patch, MagicMock
import pandas as pd
from weather_cli_tool.src.csv_exporter import CSVExporter
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TestCSVExporter(unittest.TestCase):
    def setUp(self):
        self.csv_exporter = CSVExporter()

    def test_export_to_csv(self):
        # Arrange
        data = [{'date': '2022-01-01', 'temperature': 20}, {'date': '2022-01-02', 'temperature': 25}]
        filename = 'test_weather_data.csv'

        # Act
        self.csv_exporter.export_to_csv(data, filename)

        # Assert
        try:
            df = pd.read_csv(filename)
            self.assertEqual(len(df), 2)
            self.assertEqual(df['date'].iloc[0], '2022-01-01')
            self.assertEqual(df['temperature'].iloc[0], 20)
        except Exception as e:
            logger.error(f'Error reading CSV file: {e}')
            self.fail('Failed to read CSV file')

    def test_export_to_csv_empty_data(self):
        # Arrange
        data = []
        filename = 'test_weather_data.csv'

        # Act
        self.csv_exporter.export_to_csv(data, filename)

        # Assert
        try:
            df = pd.read_csv(filename)
            self.assertEqual(len(df), 0)
        except Exception as e:
            logger.error(f'Error reading CSV file: {e}')
            self.fail('Failed to read CSV file')

    @patch('pandas.DataFrame.to_csv')
    def test_export_to_csv_error(self, mock_to_csv):
        # Arrange
        data = [{'date': '2022-01-01', 'temperature': 20}]
        filename = 'test_weather_data.csv'
        mock_to_csv.side_effect = Exception('Mocked error')

        # Act and Assert
        with self.assertRaises(Exception):
            self.csv_exporter.export_to_csv(data, filename)

if __name__ == '__main__':
    unittest.main()