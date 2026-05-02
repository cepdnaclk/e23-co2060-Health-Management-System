import heroImage from "../../background images/background 1 .jpeg";
import authBackgroundFade from "../../background images/background-fade.avif";
import authDoctorVisual from "../../background images/doctor_log_sign.avif";
import authPatientVisual from "../../background images/patient_log_sign.jpg";
import doctorDefaultImage from "../assets/doctors/defaultone.jpg";
import doctorNethmiImage from "../assets/doctors/nethmiperera.webp";
import doctorKavinduImage from "../assets/doctors/kavindujayasinghe.jpg";
import doctorTharushiImage from "../assets/doctors/tharushisilva.webp";
import doctorIsuruImage from "../assets/doctors/isurufernando.jpg";
import doctorAnjaliImage from "../assets/doctors/anjaliwijeratne.jpg";
import doctorMalithImage from "../assets/doctors/malithgunasekara.webp";
import doctorSamadhiImage from "../assets/doctors/samadhiranasinghe.webp";

export const landingHero = heroImage;
export const authBackground = authBackgroundFade;
export const authDoctorImage = authDoctorVisual;
export const authPatientImage = authPatientVisual;

const doctorImageByUsername = {
	doctor1: doctorDefaultImage,
	doctor2: doctorNethmiImage,
	doctor3: doctorKavinduImage,
	doctor4: doctorTharushiImage,
	doctor5: doctorIsuruImage,
	doctor6: doctorAnjaliImage,
	doctor7: doctorMalithImage,
	doctor8: doctorSamadhiImage
};

export function getDoctorImage(username) {
	return doctorImageByUsername[String(username || "").trim()] || null;
}
