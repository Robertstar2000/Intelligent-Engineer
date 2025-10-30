export const ENGINEERING_DISCIPLINES = [
  'Mechanical Engineering', 'Electrical Engineering', 'Chemical Engineering',
  'Software Engineering', 'Civil Engineering', 'Aerospace Engineering',
  'Biomedical Engineering', 'Environmental Engineering', 'Materials Engineering',
  'Nuclear Engineering', 'Industrial Engineering', 'Systems Engineering',
  'Automotive Engineering', 'Robotics Engineering', 'Petroleum Engineering',
  'Marine Engineering', 'Agricultural Engineering', 'Structural Engineering',
  'Electronics Engineering', 'Manufacturing Engineering'
];

export const PROJECT_TEMPLATES = [
    {
        name: 'Software Engineering (Web App)',
        description: 'An agile template for developing a modern web application, focusing on user stories, APIs, and cloud deployment.',
        icon: '💻',
        requirements: 'As a [user type], I want to [goal] so that I can [benefit]. The platform must handle [number] of concurrent users and have an API response time under [time]ms. The system must be deployable on a major cloud provider (e.g., GCP, AWS).',
        constraints: 'The initial MVP must be launched by [date]. The tech stack is limited to [e.g., React, Node.js, PostgreSQL]. The development team consists of [number] engineers. The project must adhere to GDPR and CCPA data privacy regulations.'
    },
    {
        name: 'Mechanical Engineering (Consumer Product)',
        description: 'A general-purpose template for physical products following a V-model lifecycle.',
        icon: '🔧',
        requirements: 'The system shall [main function], such as [specific action]. It must achieve a performance of [key metric] and operate within an environment of [operating conditions]. The product must have a lifespan of at least [number] years.',
        constraints: 'The project budget is limited to [budget]. The target completion date is [date]. All materials must comply with [industry standard, e.g., RoHS]. The unit manufacturing cost must not exceed [cost].'
    },
    {
        name: 'Aerospace Engineering (Satellite System)',
        description: 'A rigorous template for designing a small communication satellite (CubeSat) for Low Earth Orbit (LEO).',
        icon: '🛰️',
        requirements: 'The CubeSat shall provide [e.g., S-band] communication capabilities. It must survive launch-induced vibrations of [g-force value] and operate in a temperature range of [-X°C to +Y°C]. Total mass not to exceed [mass, e.g., 10 kg].',
        constraints: 'The power budget is limited to [watts]. The project must adhere to NASA General Environmental Verification Standard (GEVS). The primary structure must be a standard [e.g., 6U] CubeSat frame.'
    },
    {
        name: 'Civil Engineering (Bridge Construction)',
        description: 'A template for planning and designing a pedestrian bridge, emphasizing structural integrity and public safety.',
        icon: '🌉',
        requirements: 'The bridge must span [length] meters over [feature]. It must support a live load of [e.g., 5 kPa] and withstand wind speeds of up to [speed] km/h. The design must be compliant with AASHTO LRFD Bridge Design Specifications.',
        constraints: 'The total construction budget is [amount]. The project must be completed by [date]. Environmental impact must be minimized, with no more than [area] of wetland disturbance. Materials must be sourced from approved local suppliers.'
    },
    {
        name: 'Electrical Engineering (PCB Design)',
        description: 'A detailed template for creating a printed circuit board (PCB) for an IoT device.',
        icon: '⚡',
        requirements: 'The PCB shall host a [microcontroller, e.g., ESP32-S3] and a [sensor type, e.g., BME680 Environmental Sensor]. It must support Wi-Fi and Bluetooth 5.0. Power consumption in deep sleep mode must be below [current, e.g., 20 µA].',
        constraints: 'The board dimensions must not exceed [Xmm x Ymm]. The design must be a [number, e.g., 4]-layer board. All components must be surface-mount devices (SMD). The project must pass FCC Part 15 certification for unintentional radiators.'
    },
    {
        name: 'Biomedical Engineering (Medical Device)',
        description: 'A template for a wearable health monitor, focusing on regulatory compliance and data accuracy.',
        icon: '⚕️',
        requirements: 'The device shall continuously monitor [e.g., heart rate, SpO2, and skin temperature]. Heart rate accuracy must be within ±[e.g., 2] bpm of a medical-grade reference. Data must be securely transmitted to a mobile application via Bluetooth Low Energy.',
        constraints: 'The device must be developed under ISO 13485 quality management systems. All patient data handling must be HIPAA compliant. All materials in contact with skin must be biocompatibility tested according to ISO 10993.'
    },
    {
        name: 'Chemical Engineering (Process Plant)',
        description: 'A template for designing a small-scale water purification system.',
        icon: '⚗️',
        requirements: 'The system must process [flow rate, e.g., 1000 liters/hour] of raw water. Output water purity must meet [standard, e.g., WHO drinking water standards], with turbidity below [value] NTU. The system must operate continuously for at least [number] hours.',
        constraints: 'The overall energy consumption shall not exceed [energy/liter]. The physical footprint is limited to [Xm x Ym]. The project must adhere to local environmental discharge regulations. Capital cost must be below [amount].'
    },
    {
        name: 'Environmental Engineering (Remediation)',
        description: 'A project template for cleaning up a contaminated industrial site.',
        icon: '🌳',
        requirements: 'The project will remediate soil contaminated with [contaminant, e.g., heavy metals]. The target cleanup level for [contaminant] is [concentration, e.g., <50 mg/kg]. The remediation process must be completed within [timeframe].',
        constraints: 'The project must comply with EPA Superfund program guidelines. Total project cost cannot exceed [budget]. The chosen remediation technology (e.g., soil vapor extraction, bioremediation) must be proven for the specific contaminants.'
    },
    {
        name: 'Robotics Engineering (Autonomous Robot)',
        description: 'A template for developing an autonomous warehouse robot for package sorting.',
        icon: '🤖',
        requirements: 'The robot must autonomously navigate a warehouse environment using [e.g., LIDAR]. It must be able to identify and pick up packages up to [weight] kg. The sorting accuracy must be at least [e.g., 99.9%].',
        constraints: 'The robot must operate for a minimum of [hours] on a single charge. The system must integrate with the existing Warehouse Management System (WMS) API. The total cost per robot must not exceed [amount]. Safety systems must comply with ISO 13482.'
    },
    {
        name: 'Systems Engineering (System Integration)',
        description: 'A template for integrating a new sensor suite into an existing vehicle platform.',
        icon: '🔗',
        requirements: 'The project will integrate a [new system, e.g., thermal imaging camera] with the vehicle\'s existing [legacy system, e.g., CAN bus network]. Data from the new system must be displayed on the central console with a latency of less than [time]ms.',
        constraints: 'The integration must not require modification of the vehicle\'s primary structure. The total power draw of the new components cannot exceed [watts]. All new wiring must use mil-spec connectors and adhere to the existing vehicle wiring standards.'
    },
    {
        name: 'Materials Engineering (Alloy Development)',
        description: 'A template for R&D of a new lightweight, high-strength alloy for a specific application.',
        icon: '🔬',
        requirements: 'The new alloy must have a tensile strength greater than [value, e.g., 600 MPa] and a density less than [value, e.g., 3 g/cm³]. It must exhibit corrosion resistance comparable to [benchmark material, e.g., 7075-T6 aluminum].',
        constraints: 'The cost of raw materials for the alloy must not exceed [cost/kg]. The alloy must be manufacturable using existing casting and forging techniques. The project has a [number]-month timeline for initial sample production and testing.'
    },
    {
        name: 'Agricultural Engineering (Precision Farming Drone)',
        description: 'A template for an autonomous drone that monitors crop health using multispectral imaging.',
        icon: '🚁',
        requirements: 'The drone must be capable of flying pre-programmed routes over a [area, e.g., 100-hectare] field. It will carry a multispectral camera to calculate NDVI (Normalized Difference Vegetation Index). The system must process and deliver a crop health map within [hours] of flight.',
        constraints: 'Minimum flight time on a single battery must be [minutes]. The system must comply with FAA regulations for commercial drone operation. The total cost of the drone and sensor package must be under [amount].'
    }
];
