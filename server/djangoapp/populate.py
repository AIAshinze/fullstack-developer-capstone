from .models import CarMake, CarModel


def initiate():
    if CarMake.objects.exists():
        return

    car_make_data = [
        {"name": "NISSAN", "description": "Great cars. Japanese technology"},
        {"name": "Mercedes", "description": "Great cars. German technology"},
        {"name": "Audi", "description": "Great cars. German technology"},
        {"name": "Kia", "description": "Great cars. Korean technology"},
        {"name": "Toyota", "description": "Great cars. Japanese technology"},
    ]

    car_model_data = {
        "NISSAN": [("Altima", "SEDAN", 2020), ("Rogue", "SUV", 2021)],
        "Mercedes": [("C-Class", "SEDAN", 2022), ("GLE", "SUV", 2023)],
        "Audi": [("A4", "SEDAN", 2021), ("Q5", "SUV", 2022)],
        "Kia": [("Sorento", "SUV", 2020), ("Forte", "SEDAN", 2021)],
        "Toyota": [("Camry", "SEDAN", 2022), ("Highlander", "SUV", 2023)],
    }

    for make_data in car_make_data:
        make = CarMake.objects.create(name=make_data['name'], description=make_data['description'])
        for model_name, model_type, model_year in car_model_data.get(make_data['name'], []):
            CarModel.objects.create(car_make=make, name=model_name, type=model_type, year=model_year, dealer_id=1)
