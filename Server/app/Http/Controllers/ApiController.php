<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Message;
use App\User;
use App\Pairing;
use App\AppList;
use Response;
use Auth;
use Log;

use App\Http\Requests;

class ApiController extends Controller
{
    /**
     * Notify the user that they have a message
     */
    function NotifyMessageReceiver($token, $count)
    {
        if ($token) {
            $command = escapeshellcmd("../Messenger.py --unread $count receive " . $token);
            $output = shell_exec($command);
        }
    }

    /**
     * Notify the partner that the user has opened the app
     * (Allows us to mark messages as read on their screen)
     */
    function NotifyMessageSender($token)
    {
        if ($token) {
            $command = escapeshellcmd('../Messenger.py read ' . $token);
            $output = shell_exec($command);
        }
    }

    /**
     * Send typing notification to device
     */
    function NotifyTyping($token)
    {
        if ($token) {
            $command = escapeshellcmd('../Messenger.py typing ' . $token);
            $output = shell_exec($command);
        }
    }

    /**
     * Send typing notification to device
     */
    function NotifyDoneTyping($token)
    {
        if ($token) {
            $command = escapeshellcmd('../Messenger.py typing_done ' . $token);
            $output = shell_exec($command);
        }
    }

    /**
     * Post request to send typing notification to partner
     */
    function PostTyping(Request $request)
    {
        if (Auth::check()) {
            $user = Auth::user();
            // Send typing notification to partner
            $this->NotifyTyping($user->peer->fcm_id);
        }
    }

    function PostTypingDone(Request $request)
    {
        if (Auth::check()) {
            $user = Auth::user();
            // Send typing notification to partner
            $this->NotifyDoneTyping($user->peer->fcm_id);
        }
    }

    function Test()
    {
        // return Auth::user()->messages->count();
    }

    /**
     * Saves the message in the database and let's the queue know there's a message to send
     */
    function PostMessage(Request $request)
    {
        $result = ['result' => 'success'];
        if (Auth::check()) {
            $user = Auth::user();

            $message = new Message;
            $message->message = $request->input("message");
            $message->image   = $request->input("image");
            $message->to = $user->partner;
            $message->save();

            $partner = $user->peer;
            if ($partner) {
                $this->NotifyMessageReceiver($partner->fcm_id, $partner->messages->count());
            }
            return response()->json($result);
        }
        $result['result'] = 'failure';
        return response()->json($result);
    }

    /**
     * Registers the device as a user
     */
    function PostRegisterDevice(Request $request)
    {
        if (Auth::check()) {
            $token = $request->input('token');
            $user = Auth::user();
            $user->fcm_id = $token;
            $user->save();
        }
    }

    /**
     * Get messages
     */
    function GetMessages(Request $request)
    {
        if (Auth::check()) {
            $user = Auth::user();
            $messages = $user->messages;
            $notify = $request->input('notify');
            $messagesRead = false;
            foreach ($messages as $msg) {
                //TODO remove sent field
                $msg->sent = 1; // This doesn't really matter since the messages is deleted
                // Delete messages once they've been retrieved
                // That's the point of security
                $msg->delete();
            }

            $partner = $user->peer;
            // Shouldn't be possible to get here w/o a partner, but
            // check anyway
            if ($partner && $notify) {
                $this->NotifyMessageSender($partner->fcm_id);
                // If there are no messages pending for your peer, then they're read
                // There could be a race condition against posting a message and receiving this
                // But hopefully we don't see that often
                if ($partner->messages->count() == 0) {
                    $messagesRead = true;
                }
            }
            $output = ['messages' => $messages, 'read' => $messagesRead];
            return response()->json($output);
        }
        return response('Forbidden', 403);
    }

    /**
     * Mark messages read on the paired device
     */
    function PostMarkRead(Request $request)
    {
        if (Auth::check())
        {
            $user = Auth::user();
            if ($user->peer) {
                $this->NotifyMessageSender($user->peer->fcm_id);
            }
        }
    }

    /**
     * Gets user information once user is logged in
     */
    function GetRegisterDevice(Request $request) {
        $data = ['loggedIn' => false];
        if (Auth::check()) {
            $data['loggedIn'] = true;
            $user = Auth::user();
            $data['paired'] = $user->partner ? true : false;
        }

        return $data;
    }

    /**
     * Generates a pairing code for the logged in user
     */
    function GetPairingCode() {
        if (Auth::check()) {
            $user = Auth::user();
            if (!$user->pairing) {
                $pairing = new Pairing;
                $pairing->user_id = $user->id;
                // Get random 4 digit number
                $n = rand(0, 9999);
                $pin = sprintf("%04d", $n);
                $pairing->pairing_code = $pin;
                $pairing->save();
            } else {
                $pairing = $user->pairing;
            }
            return response()->json($pairing);
        }
        // Do nothing if not logged in
        return response('Forbidden', 403);
    }

    /**
     * Other device posts this code, meaning they're pairing
     * to the device that generated the code.
     */
    function PostPairingCode(Request $request) {
        if (Auth::check()) {
            $user = Auth::user();
            $code = $request->input('code');
            // paring_code is unique, so just get first since there
            // can only be one
            $pairing = Pairing::where('pairing_code', $code)->first();
            if ($pairing) {
                $partnerId = $pairing->user->id;
                // Can't pair with yourself
                // if ($partnerId == $user->id) {
                //     return response()->json(['success' => false]);
                // }

                // devices will be paired, remove row from pairing DB
                $pairing->delete();

                // Now update each user with the pairings
                // Current user will be partnered with the user from the pairing table
                $user->partner = $partnerId;
                $user->save();
                // Partner is paired with current user
                $partner = User::find($partnerId);
                $partner->partner = $user->id;
                $partner->save();

                return response()->json(['success' => true]);
            } else {
                return response()->json(['success' => false]);
            }
        }
        return response('Forbidden', 403);
    }

    /**
     * Retrieve any updates to lists
     */
    function GetLists(Request $request)
    {
        if (Auth::check())
        {
            $userId = Auth::user()->id;
            // There should only ever be one or there's a bug
            $list = AppList::where('to', $userId)->first();
            if ($list)
            {
                $list->delete();
                return $list->list;
            }
            else
            {
                return "";
            }
        }
        return response('Forbidden', 403);
    }

    function PostLists(Request $request)
    {
        if (Auth::check())
        {
            $partnerId = Auth::user()->peer->id;
            $list = $request->input('list');
            if ($list)
            {
                // Remove the old lists here
                $oldList = AppList::where('to', Auth::user()->peer->id)->first();
                if ($oldList)
                {
                    $oldList->delete();
                }
                $listToSave = new AppList;
                $listToSave->to = $partnerId;
                $listToSave->list = $list;
                $listToSave->save();
            }
            return;
        }
        return response('Forbidden', 403);
    }

    /**
     * returns apk file download
     */
    function GetApk(Request $request) {
        $apkPath = base_path() ."/releases/". env('APK_NAME');
        $headers = array('Content-Type' => 'application/vnd.android.package-archive');

        return Response::download($apkPath, env('APK_NAME'), $headers);

        // return response()->header('Content-Type', 'application/vnd.android.package-archive')->download(base_path() ."/releases/". env('APK_NAME'), env('APK_NAME'));
    }
}
