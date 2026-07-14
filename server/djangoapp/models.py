"""Django models for the dealership inventory and vehicle catalog.

These models power the car make/model data used in the review submission flow.
"""

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class CarMake(models.Model):
    """Represents a vehicle manufacturer in the inventory catalog."""

    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        """Return the human-readable name of the vehicle make."""
        return self.name


class CarModel(models.Model):
    """Represents a vehicle model associated with a car make."""

    CAR_TYPES = [
        ('SEDAN', 'Sedan'),
        ('SUV', 'SUV'),
        ('WAGON', 'Wagon'),
        ('COUPE', 'Coupe'),
        ('TRUCK', 'Truck'),
    ]

    car_make = models.ForeignKey(
        CarMake,
        related_name='models',
        on_delete=models.CASCADE,
    )
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=10, choices=CAR_TYPES, default='SUV')
    year = models.IntegerField(
        default=2023,
        validators=[MinValueValidator(2015), MaxValueValidator(2023)],
    )
    dealer_id = models.IntegerField(default=1)

    def __str__(self):
        """Return the full vehicle name for display in the admin UI."""
        return f'{self.car_make.name} {self.name}'
