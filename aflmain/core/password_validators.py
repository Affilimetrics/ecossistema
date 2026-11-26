from django.core.exceptions import ValidationError


class NumberAndSpecialCharacterValidator:
    """Exige pelo menos um dígito e um caractere especial na senha."""

    def validate(self, password, user=None):
        if not any(character.isdigit() for character in password):
            raise ValidationError("A senha deve conter pelo menos um número.", code="password_no_number")
        if not any(not character.isalnum() and not character.isspace() for character in password):
            raise ValidationError("A senha deve conter pelo menos um caractere especial.", code="password_no_special")

    def get_help_text(self):
        return "A senha deve conter pelo menos um número e um caractere especial."
