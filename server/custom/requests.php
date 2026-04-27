<?php
namespace Server\Custom;

define("PERMISSIONS_QUERY", "select * from `permissionLevels`");
define("STATES_QUERY", "select * from `reservationStates`");
define("GET_PRICE_QUERY", "select `pricePerMonth` from `hostings` where `hostingID` = :hostingID");
define("NEW_REQUEST_QUERY", "insert into `reservations` (`stateID`, `userID`, `hostingID`, `months`, `note`, `price`) values (1, :userID, :hostingID, :months, :note, :price)");
define("VERIFY_REQUEST_USER_QUERY", "select * from `reservations` where `userID` = :userID and `reservationID` = :reservationID");
define("GET_USER_REQUESTS_QUERY", "select * from `reservations` where `userID` = :userID and `stateID` <> 5");
define("GET_ADMIN_REQUESTS_QUERY", "select * from `reservations`");
define("CLOSE_REQUEST_QUERY", "update `reservations` set `stateID` = 5 where `reservationID` = :reservationID");
define("CREDENTALS_QUERY", "select `lastName`, `firstName` from `users` where `userID` = :userID");
define("GET_STATE_QUERY", "select `stateID` from `reservations` where `reservationID` = :reservationID");
define("GET_MONTHS_QUERY", "select `months` from `reservations` where `reservationID` = :reservationID");
define("UPDATE_STATE_QUERY", "update `reservations` set `stateID` = :stateID, `expirationDate` = :expirationDate where `reservationID` = :reservationID");

class Requests {
    static public function getPermissions(): array {
        global $database;
        $output = [];

        $raw = $database->returnQuery(
            PERMISSIONS_QUERY,
            "assoc"
        );

        foreach ($raw as $permission) {
            $output[] = [
                'permissionID' => $permission['permissionID'],
                'permission' => $permission['permission'],
            ];
        }

        return $output;
    }



    static public function getStates(): array {
        global $database;
        $output = [];

        $raw = $database->returnQuery(
            STATES_QUERY,
            "assoc"
        );

        foreach ($raw as $state) {
            $output[] = [
                'stateID' => $state['stateID'],
                'state' => $state['state']
            ];
        }

        return $output;
    }



    static public function newRequest(int $hostingID, int $months, int $userID, string $note = ''): bool {
        global $database;
        $output = false;

        if ($monthly_price = $database->returnQuery(
            GET_PRICE_QUERY,
            "single",
            [ 'hostingID' => $hostingID ]
        )) {
            $final_price = $monthly_price * $months;

            if ($database->returnQuery(
                NEW_REQUEST_QUERY,
                "bool",
                [
                    'userID' => $userID,
                    'hostingID' => $hostingID,
                    'months' => $months,
                    'note' => $note,
                    'price' => $final_price
                ]
            )) {
                $output = true;
                $_SESSION['msg']['std'][] = "Заявка успешно сформирована!";
            }
        }

        return $output;
    }



    static public function closeRequest(int $reservationID, int $userID): bool|array {
        global $database;
        $output = false;

        if ($database->returnQuery(
            VERIFY_REQUEST_USER_QUERY,
            "bool",
            [
                'userID' => $userID,
                'reservationID' => $reservationID
            ]
        )) {
            if ($database->returnQuery(
                CLOSE_REQUEST_QUERY,
                "bool",
                [ 'reservationID' => $reservationID ]
            )) {
                $output = true;
                $SESSION['msg']['std'][] = "Заявка отменена";
            }
        }

        return $output;
        /* return [ */
        /*     'reservationID' => $reservationID, */
        /*     'userID' => $userID */
        /* ]; */
    }



    static public function getRequests(int $userID): bool|array {
        global $database;
        $output = false;

        $raw = $database->returnQuery(
            GET_USER_REQUESTS_QUERY,
            "assoc",
            [ 'userID' => $userID ]
        );

        $output = [];
        foreach ($raw as $item) {
            $output[] = [
                'reservationID' => $item['reservationID'],
                'stateID' => $item['stateID'],
                'userID' => $item['userID'],
                'hostingID' => $item['hostingID'],
                'months' => $item['months'],
                'expirationDate' => $item['expirationDate'],
                'note' => $item['note'],
                'price' => $item['price'],
            ];
        }

        return $output;
    }



    static public function getRequestsAdmin(): array {
        global $database;
        $output = [];

        $raw = $database->returnQuery(
            GET_ADMIN_REQUESTS_QUERY,
            "assoc"
        );

        foreach ($raw as $item) {
            $credentials = $database->returnQuery(
                CREDENTALS_QUERY,
                "assoc",
                [ 'userID' => $item['userID'] ]
            )[0];
            $output[] = [
                'reservationID' => $item['reservationID'],
                'stateID' => $item['stateID'],
                'userID' => $item['userID'],
                'credentials' => $credentials['lastName'] . " " . $credentials['firstName'],
                'hostingID' => $item['hostingID'],
                'months' => $item['months'],
                'expirationDate' => $item['expirationDate'],
                'note' => $item['note'],
                'price' => $item['price'],
            ];
        }

        return $output;
    }



    static public function setStatus(int $reservationID, int $stateID): array {
        global $database;
        $output = [
            'type' => "error",
            'message' => "Не удалось сменить статус заявки"
        ];

        if (!empty($reservationID) && !empty($stateID)) {
            if ($database->returnQuery(
                GET_STATE_QUERY,
                "single",
                [ 'reservationID' => $reservationID ]
            ) == $stateID ) {
                $output['message'] = "Статус остался прежним";
                $output['type'] = "std";
            } else {
                $expiration_date = null;
                if ($stateID == 2) {
                    $months = $database->returnQuery(
                        GET_MONTHS_QUERY,
                        "single",
                        [ 'reservationID' => $reservationID ]
                    );
                    $expiration_date = date('Y-m-d', strtotime(date('Y-m-d') . " + " . $months . " months"));
                }
                if ($database->returnQuery(
                    UPDATE_STATE_QUERY,
                    "bool",
                    [
                        'stateID' => $stateID,
                        'expirationDate' => $expiration_date,
                        'reservationID' => $reservationID
                    ]
                )) {
                    $output['message'] = "Данные успешно внесены";
                    $output['type'] = "std";
                }
            }
        }

        return $output;
    }
}
