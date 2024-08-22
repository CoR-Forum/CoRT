// This files allows you to easily switch the data sources and urls if you
// don't want use the github site and my data. You may need to fiddle with paths
// since my api base has not the same structure than the repo. If you git pull,
// don't forget to copy this file in a temp directory and copying it back after
// the pull!

// The root where all API files can be found
export const __api__base = "https://hail.thebus.top/CoRT";

// New API url for cor-forum CoRT
export const __api__cort = "https://cort.cor-forum.de/";

// The API url used by login and marketplace
// check if the host is localhost, use http://localhost:8080/api/v1, else use https://api.cort.cor-forum.de/api/v1
export const __api__market = window.location.hostname === "localhost" ? "http://localhost:8080/api/v1" : "https://cort.cor-forum.de/api/v1";

// Used by the trainer to filter setup submissions
export const __api__frontsite = "https://cort.cor-forum.de";
// Subdirectory where the HTML/JS/CSS/etc. files are placed, relative to your
// www root with the leading '/'
export const __api__frontsite_dir = "/";

export const __api__urls = {
	"submit_trainer": `${__api__base}/collect/submit.php`,
	"trainer_data": `${__api__base}/collect/data.txt`,
	"events": `${__api__base}/warstatus/stats/allevents.json`,
	"stats": `${__api__base}/warstatus/stats/statistics.json`,
	"wstatus": `${__api__base}/warstatus/warstatus.json`
};
