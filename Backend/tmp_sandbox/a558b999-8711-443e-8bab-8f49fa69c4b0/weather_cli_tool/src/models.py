from dataclasses import dataclass
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

@dataclass
class WeatherData:
    date: datetime
    location: str
    temperature: float
    humidity: float
    description: str

    def __post_init__(self):
        try:
            self.date = datetime.strptime(self.date, '%Y-%m-%d %H:%M:%S')
        except ValueError as e:
            logging.error(f'Invalid date format: {e}')
            raise

    def to_dict(self):
        return {
            'date': self.date.strftime('%Y-%m-%d %H:%M:%S'),
            'location': self.location,
            'temperature': self.temperature,
            'humidity': self.humidity,
            'description': self.description
        }

class WeatherDataError(Exception):
    pass

class InvalidWeatherDataError(WeatherDataError):
    pass
