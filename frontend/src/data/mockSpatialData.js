export const mockClaims = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        claimId: 'CLM001',
        featureType: 'IFR',
        claimantName: 'John Doe',
        description: 'Claim for individual forest land rights',
        status: 'Pending',
        dateFiled: '2025-01-15',
        state: 'Madhya Pradesh',
        district: 'Bhopal',
        village: 'Village A',
        tribalGroup: 'Gond',
        eligibleSchemes: ['PM-KISAN', 'Jal Jeevan Mission']
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [77.675, 22.675], // Expanded from [77.9, 22.9]
            [78.125, 22.675], // to cover 0.5° x 0.5°
            [78.125, 23.125],
            [77.675, 23.125],
            [77.675, 22.675]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        claimId: 'CLM004',
        featureType: 'IFR',
        claimantName: 'Priya Patel',
        description: 'Individual claim for agricultural land rights',
        status: 'Under Review',
        dateFiled: '2025-04-20',
        state: 'Telangana',
        district: 'Hyderabad',
        village: 'Village F',
        tribalGroup: 'Lambada',
        eligibleSchemes: ['Jal Jeevan Mission', 'DAJGUA']
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [78.025, 17.025], // Expanded from [78.25, 17.25]
            [78.475, 17.025],
            [78.475, 17.475],
            [78.025, 17.475],
            [78.025, 17.025]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        claimId: 'CLM003',
        featureType: 'CR',
        claimantName: 'Rahul Sharma',
        description: 'Community rights over forest produce',
        status: 'Rejected',
        dateFiled: '2025-03-05',
        state: 'Odisha',
        district: 'Bhubaneswar',
        village: 'Village E',
        tribalGroup: 'Santal',
        eligibleSchemes: []
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [85.025, 20.025], // Expanded from [85.25, 20.25]
            [85.475, 20.025],
            [85.475, 20.475],
            [85.025, 20.475],
            [85.025, 20.025]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        claimId: 'CLM006',
        featureType: 'CR',
        claimantName: 'Sunita Devi',
        description: 'Community claim for access to forest resources',
        status: 'Pending',
        dateFiled: '2025-06-01',
        state: 'Tripura',
        district: 'Dhalai',
        village: 'Village D',
        tribalGroup: 'Tripuri',
        eligibleSchemes: ['PM-KISAN']
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [91.525, 23.525], // Expanded from [91.75, 23.75]
            [91.975, 23.525],
            [91.975, 23.975],
            [91.525, 23.975],
            [91.525, 23.525]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        claimId: 'CLM002',
        featureType: 'CFR',
        claimantName: 'Jane Smith',
        description: 'Community claim for forest resource management',
        status: 'Approved',
        dateFiled: '2025-02-10',
        state: 'Tripura',
        district: 'Agartala',
        village: 'Village C',
        tribalGroup: 'Tripuri',
        eligibleSchemes: ['PM-KISAN', 'MGNREGA']
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [91.025, 23.525], // Expanded from [91.25, 23.75]
            [91.475, 23.525],
            [91.475, 23.975],
            [91.025, 23.975],
            [91.025, 23.525]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        claimId: 'CLM005',
        featureType: 'CFR',
        claimantName: 'Amit Kumar',
        description: 'Community claim for forest conservation rights',
        status: 'Approved',
        dateFiled: '2025-05-10',
        state: 'Madhya Pradesh',
        district: 'Indore',
        village: 'Village B',
        tribalGroup: 'Bhil',
        eligibleSchemes: ['PM-KISAN', 'MGNREGA']
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [75.675, 22.175], // Expanded from [75.9, 22.4]
            [76.125, 22.175],
            [76.125, 22.625],
            [75.675, 22.625],
            [75.675, 22.175]
          ]
        ]
      }
    }
  ]
};