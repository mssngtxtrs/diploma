<?php
namespace Server\Custom;

/* Стандартный запрос */
define("HOSTINGS_QUERY", "select * from `hostings`");
define("CPU_QUERY", "select * from `cpu`");

/* Класс "Хостинги" */
class Hostings {
    /* Функция получения данных о хостингах */
    static public function returnHostings(): string|array {
        global $database;
        $output = "";

        if ($raw = $database->returnQuery(
            HOSTINGS_QUERY,
            "assoc"
        )) {
            $output = [];
            foreach ($raw as $hosting) {
                $output[] = [
                    'hostingID' => $hosting['hostingID'],
                    'hostingAlias' => $hosting['hostingAlias'],
                    'cpuID' => $hosting['cpuID'],
                    'ram' => $hosting['ram'],
                    'ramUser' => $hosting['ramUser'],
                    'diskSpace' => $hosting['diskSpace'],
                    'diskSpaceUser' => $hosting['diskSpaceUser'],
                    'pricePerMonth' => $hosting['pricePerMonth'],
                ];
            }
        }

        return $output;
    }

    /* Функция получения данных о процессоре */
    static public function returnCPU(): array {
        global $database;
        $output = false;

        if ($raw = $database->returnQuery(
            CPU_QUERY,
            "assoc"
        )) {
            $output = [];
            foreach ($raw as $cpu) {
                $output[] = [
                    'cpuID' => $cpu['cpuID'],
                    'cpuName' => $cpu['cpuName'],
                    'frequency' => $cpu['frequency'],
                    'cores' => $cpu['cores'],
                    'threads' => $cpu['threads'],
                    'cacheL3' => $cpu['cacheL3'],
                    'cacheL2' => $cpu['cacheL2'],
                    'cacheL1' => $cpu['cacheL1'],
                ];
            }
        }

        return $output;
    }
}
?>
