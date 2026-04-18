/**
 * EventBus — ergonomic in-process producer helper.
 *
 * In-process code (plugins, hacks, custom tools) fires events through this
 * facade instead of standing up an HTTP client or plumbing the raw EventLog
 * through deep callers. Semantically identical to `eventLog.append` — writes
 * to the same JSONL log, fans out through the same ListenerRegistry.
 *
 * Two entry points:
 *   - `fire(type, payload, opts)` — typed against AgentEventMap
 *   - `fire.trigger(source, name, data)` — shortcut for the most common
 *     case: "I just want to poke Alice with something"
 */

import type {
  AgentEventMap,
  TriggerPayload,
} from './agent-event.js'
import type { AppendOpts, EventLog, EventLogEntry } from './event-log.js'

export interface EventBus {
  /** Emit any registered event type. Runtime-validated against the schema. */
  <K extends keyof AgentEventMap>(
    type: K,
    payload: AgentEventMap[K],
    opts?: AppendOpts,
  ): Promise<EventLogEntry<AgentEventMap[K]>>

  /** Shortcut for the common "poke Alice" case — emits a `trigger` event. */
  trigger(
    source: string,
    name: string,
    data?: Record<string, unknown>,
    opts?: AppendOpts,
  ): Promise<EventLogEntry<TriggerPayload>>
}

/** Build an EventBus facade over the EventLog. */
export function createEventBus(eventLog: EventLog): EventBus {
  const fire = (async <K extends keyof AgentEventMap>(
    type: K,
    payload: AgentEventMap[K],
    opts?: AppendOpts,
  ) => {
    return eventLog.append(type, payload, opts)
  }) as EventBus

  fire.trigger = async (
    source: string,
    name: string,
    data: Record<string, unknown> = {},
    opts?: AppendOpts,
  ) => {
    return eventLog.append('trigger', { source, name, data }, opts)
  }

  return fire
}
