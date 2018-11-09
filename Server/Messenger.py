#!/usr/bin/python
import sys
import argparse
import firebase_admin
from firebase_admin import messaging

ACTION_MESSAGE_RECEIVED="receive"
ACTION_MESSAGE_READ="read"
ACTION_MESSAGE_TYPING="typing"
ACTION_MESSAGE_DONE_TYPING="typing_done"

def initFirebase():
    cred = firebase_admin.credentials.Certificate("/home/dangarbri/together/together-a2f46-firebase-adminsdk-54w0f-44df36ebd3.json")
    app = firebase_admin.initialize_app(cred)
    return app

def notifyReceiver(fb, token, count):
    messageText = "message received"
    if (count):
        if (count == 1):
            messageText = "1 message received"
        else:
            messageText = "%d messages received" % count

    androidNotification = messaging.AndroidNotification(sound="default", click_action="FCM_PLUGIN_ACTIVITY", tag="ONLY EVER UPDATE THIS ONE")
    androidConfig = messaging.AndroidConfig(collapse_key="key", priority="high", notification=androidNotification)
    messageNotification = messaging.Notification(title="Together", body=messageText)
    message = messaging.Message(data={"action": ACTION_MESSAGE_RECEIVED},
        notification=messageNotification,
        token=token,
        android=androidConfig)
    messaging.send(message, dry_run=False, app=fb)

def notifySenderMessageRead(fb, token):
    androidNotification = messaging.AndroidNotification(sound="default", click_action="FCM_PLUGIN_ACTIVITY")
    androidConfig = messaging.AndroidConfig(collapse_key="key", priority="high", notification=androidNotification)
    message = messaging.Message(data={"action": ACTION_MESSAGE_READ},
        token=token)
    messaging.send(message, dry_run=False, app=fb)

def notifyTyping(fb, token):
    androidNotification = messaging.AndroidNotification(sound="default", click_action="FCM_PLUGIN_ACTIVITY")
    androidConfig = messaging.AndroidConfig(collapse_key="key", priority="high", notification=androidNotification)
    # create message
    # TODO in the future maybe we'll add a preview
    message = messaging.Message(data={"action": ACTION_MESSAGE_TYPING},
        token=token)

    messaging.send(message, dry_run=False, app=fb)

def notifyDoneTyping(fb, token):
    androidNotification = messaging.AndroidNotification(sound="default", click_action="FCM_PLUGIN_ACTIVITY")
    androidConfig = messaging.AndroidConfig(collapse_key="key", priority="high", notification=androidNotification)
    # create message
    # TODO in the future maybe we'll add a preview
    message = messaging.Message(data={"action": ACTION_MESSAGE_DONE_TYPING},
        token=token)

    messaging.send(message, dry_run=False, app=fb)

def parseArgs():
    parser = argparse.ArgumentParser(description="Tool for sending firebase cloud messages to the together app")
    parser.add_argument('action', type=str, help='the action being performed',
                        choices=['receive', 'read', 'typing', 'typing_done'])
    parser.add_argument('token', type=str, help='Target device token')
    parser.add_argument('--unread', metavar='Number', type=int, help='Number of unread messages for receive notification')
    return parser.parse_args()

def main():
    args = parseArgs()
    fb = initFirebase()
    if (args.action == ACTION_MESSAGE_RECEIVED):
        notifyReceiver(fb, args.token, args.unread)
    elif (args.action == ACTION_MESSAGE_READ):
        notifySenderMessageRead(fb, args.token)
    elif (args.action == ACTION_MESSAGE_TYPING):
        notifyTyping(fb, args.token)
    elif (args.action == ACTION_MESSAGE_DONE_TYPING):
        notifyDoneTyping(fb, args.token)

main()
