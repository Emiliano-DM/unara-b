export enum TripEventType {
  // Survey events
  SURVEY_CREATED = 'survey:created',
  SURVEY_VOTED = 'survey:voted',
  SURVEY_CLOSED = 'survey:closed',

  // Place events
  PLACE_ADDED = 'place:added',
  PLACE_UPDATED = 'place:updated',
  PLACE_REMOVED = 'place:removed',

  // Activity events
  ACTIVITY_ADDED = 'activity:added',
  ACTIVITY_UPDATED = 'activity:updated',
  ACTIVITY_REMOVED = 'activity:removed',

  // Trip events
  TRIP_UPDATED = 'trip:updated',

  // Member events
  MEMBER_JOINED = 'member:joined',
  MEMBER_LEFT = 'member:left',
}

export interface TripEventPayload<T = any> {
  type: TripEventType;
  tripId: string;
  userId: string;
  timestamp: Date;
  data: T;
}

export interface SurveyEventData {
  surveyId: string;
  question: string;
  category: string;
  closed?: boolean;
  winningOption?: {
    id: string;
    text: string;
    latitude?: number;
    longitude?: number;
    datetime?: Date;
    endDatetime?: Date;
  };
}

export interface PlaceEventData {
  placeId: string;
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
}

export interface ActivityEventData {
  activityId: string;
  name: string;
  date: Date;
  placeId?: string;
  description?: string;
}

export interface TripUpdateEventData {
  tripId: string;
  changes: {
    destination?: string;
    destination_latitude?: number;
    destination_longitude?: number;
    startDate?: Date;
    endDate?: Date;
  };
  reason: 'survey_result' | 'manual_update';
  surveyId?: string;
}
