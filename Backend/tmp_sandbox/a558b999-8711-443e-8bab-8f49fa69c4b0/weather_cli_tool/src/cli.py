import click
import logging
from weather_cli_tool.src.scraper import scrape_weather_data
from weather_cli_tool.src.csv_exporter import export_to_csv

# Set up logging configuration
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

@click.group()
def cli():
    pass

@cli.command()
@click.option('--location', help='Location to scrape weather data for')
@click.option('--output', help='Output CSV file path')
def scrape(location, output):
    try:
        # Scrape weather data
        weather_data = scrape_weather_data(location)
        # Export to CSV
        export_to_csv(weather_data, output)
        logging.info(f'Weather data scraped and exported to {output} successfully')
    except Exception as e:
        logging.error(f'Error scraping or exporting weather data: {str(e)}')

@cli.command()
@click.option('--input', help='Input CSV file path')
@click.option('--output', help='Output CSV file path')
def convert(input, output):
    try:
        # Read input CSV
        import pandas as pd
        df = pd.read_csv(input)
        # Export to CSV
        df.to_csv(output, index=False)
        logging.info(f'CSV data converted and exported to {output} successfully')
    except Exception as e:
        logging.error(f'Error converting or exporting CSV data: {str(e)}')

if __name__ == '__main__':
    cli()