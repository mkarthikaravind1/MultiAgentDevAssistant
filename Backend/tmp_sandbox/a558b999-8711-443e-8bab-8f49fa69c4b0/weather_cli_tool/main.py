import click
import pandas as pd
from src.scraper import scrape_weather_data
from src.csv_exporter import export_to_csv

@click.command()
@click.option('--location', prompt='Location', help='The location for which to scrape weather data.')
@click.option('--output', prompt='Output file', help='The file to which to export the scraped weather data.')
@click.option('--source', prompt='Weather data source', help='The source from which to scrape weather data.')
def main(location, output, source):
    weather_data = scrape_weather_data(location, source)
    export_to_csv(weather_data, output)

if __name__ == '__main__':
    main()