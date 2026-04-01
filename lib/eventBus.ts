
type EventCallback = (data: any) => void;

class EventBus {
  private events: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  emit(event: string, data?: any) {
    const callbacks = this.events.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }

  off(event: string, callback: EventCallback) {
    const callbacks = this.events.get(event) || [];
    this.events.set(event, callbacks.filter(cb => cb !== callback));
  }
}

export const eventBus = new EventBus();

// Dictionnaire des signaux neuronaux
export const EVENTS = {
  CASH_UPDATED: 'cash_updated',
  INVOICE_VALIDATED: 'invoice_validated',
  EMPLOYEE_ADDED: 'employee_added',
  FUSION_COMPLETE: 'fusion_complete',
  SENSITIVE_DATA_BREACH: 'sensitive_data_breach'
};
