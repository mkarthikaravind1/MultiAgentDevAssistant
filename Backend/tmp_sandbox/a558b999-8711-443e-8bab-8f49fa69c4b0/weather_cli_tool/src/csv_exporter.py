import pandas as pd
from weather_cli_tool.src.models import WeatherData

class CSVExporter:
    def __init__(self, file_path):
        self.file_path = file_path

    def export_to_csv(self, weather_data: list[WeatherData]):
        data = [
            {
                'Date': data.date,
                'Temperature': data.temperature,
                'Humidity': data.humidity,
                'Description': data.description
            } for data in weather_data
        ]
        df = pd.DataFrame(data)
        df.to_csv(self.file_path, index=False)

    @staticmethod
    def validate_file_path(file_path: str) -> bool:
        if not file_path.endswith('.csv'):
            return False
        return True