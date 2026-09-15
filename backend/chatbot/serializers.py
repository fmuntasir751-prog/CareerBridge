from rest_framework import serializers

from .models import ChatMessage


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = [
            "id",
            "role",
            "message",
            "language",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "role",
            "created_at",
        ]


class ChatRequestSerializer(serializers.Serializer):
    message = serializers.CharField(
        max_length=2000,
    )

    language = serializers.ChoiceField(
        choices=["en", "ja"],
        default="en",
    )