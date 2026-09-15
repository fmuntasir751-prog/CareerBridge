from django.urls import path

from .views import ChatView, ClearChatView


urlpatterns = [
    path("", ChatView.as_view(), name="chat"),
    path(
        "clear/",
        ClearChatView.as_view(),
        name="clear-chat",
    ),
]