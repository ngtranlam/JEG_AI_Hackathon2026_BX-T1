`GET https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks?page_num={page_num}&page_size={page_size}&filter.status={filter.status}&filter.task_ids={filter.task_ids}&filter.model={filter.model}`  [Try](https://api.byteplus.com/api-explorer/?action=ListContentsGenerationsTasks&groupName=Video%20Generation%20API&serviceCode=ark&version=2024-01-01)

You can pass in filter parameters to return matching tasks. 

<div data-tips="true" data-tips-type="default">Note</div>


<div data-tips="true" data-tips-type="default">Only historical data from the last 7 days can be queried. Time calculation is always based on UTC timestamps. The returned 7\-day historical data range is based on the time when you actually initiate the batch query request (accurate to the second), with the timestamp interval being [T\-7 days, T).</div>



<Tabs>
<Tab zoneid="opV4RT2k" title="Quick start">
<TabTitle>Quick start</TabTitle>

 <span>![图片](https://portal.volccdn.com/obj/volcfe/cloud-universal-doc/upload_b9c82890e851fc10cc31f48f9065abc6.png) </span>[Playground](https://console.byteplus.com/ark/region:ark+ap-southeast-1/experience/vision?projectName=default)<span>![图片](https://portal.volccdn.com/obj/volcfe/cloud-universal-doc/upload_2abecd05ca2779567c6d32f0ddc7874d.png) </span>[Model list](https://docs.byteplus.com/en/docs/ModelArk/1330310)<span>![图片](https://portal.volccdn.com/obj/volcfe/cloud-universal-doc/upload_a5fdd3028d35cc512a10bd71b982b6eb.png) </span>[Model billing](https://docs.byteplus.com/en/docs/ModelArk/1544106#8f25f772)<span>![图片](https://portal.volccdn.com/obj/volcfe/cloud-universal-doc/upload_afbcf38bdec05c05089d5de5c3fd8fc8.png) </span>[API key](https://console.byteplus.com/ark/region:ark+ap-southeast-1/apiKey?apikey=%7B%7D)

 <span>![图片](https://portal.volccdn.com/obj/volcfe/cloud-universal-doc/upload_57d0bca8e0d122ab1191b40101b5df75.png) </span>[API tutorial](https://docs.byteplus.com/en/docs/ModelArk/1366799)<span>![图片](https://portal.volccdn.com/obj/volcfe/cloud-universal-doc/upload_f45b5cd5863d1eed3bc3c81b9af54407.png) </span>[API reference](https://docs.byteplus.com/en/docs/ModelArk/Video_Generation_API)<span>![图片](https://portal.volccdn.com/obj/volcfe/cloud-universal-doc/upload_1609c71a747f84df24be1e6421ce58f0.png) </span>[FAQs](https://docs.byteplus.com/en/docs/ModelArk/1359411)<span>![图片](https://portal.volccdn.com/obj/volcfe/cloud-universal-doc/upload_bef4bc3de3535ee19d0c5d6c37b0ffdd.png) </span>[Model activation](https://console.byteplus.com/ark/region:ark+ap-southeast-1/openManagement?LLM=%7B%7D&tab=ComputerVision)


</Tab>
<Tab zoneid="CPeW5vNl" title="Authentication">
<TabTitle>Authentication</TabTitle>

This interface only supports API Key authentication. Obtain a long\-term API Key on the[ API keys](https://console.byteplus.com/ark/region:ark+ap-southeast-1/apiKey?apikey=%7B%7D) page.


</Tab>
</Tabs>



---



<span id="RxN8G2nH"></span>
## Request parameters

> See [Response parameters](https://docs.byteplus.com/en/docs/178/74174#7mi8G8RI)


<div data-tips="true" data-tips-type="default" data-tips-is-title="true">Note</div>


<div data-tips="true" data-tips-type="default">The following parameters are Query String Parameters, passed in the URL string.</div>



---



**page_num** `integer / null` 

Value range: [1, 500]

Page number of the returned results.


---



**page_size ** `integer / null`

Value range: [1, 500]

Number of results per page in the returned results.


---



**filter.status ** `string / null`

Filter parameter used to query tasks with a specific status.


* `queued`: Task in queue.

* `running`: Task in progress.

* `cancelled`: Cancelled task.

* `succeeded`: Successful task.

* `failed`: Failed task.



---



**filter.task_ids ** `string[] / null`

Video generation task ID for exact search, supports batch search. Multiple task IDs are connected with `&`.

Example: `filter.task_ids=id1&filter.task_ids=id2`.


---



**filter.model ** `string / null` `Conditionally required`

Model ID or endpoint ID for exact search. Only one input is supported.

When the permission of your API key is **Custom**, you must manually enter the model ID or endpoint ID to query.

<div data-tips="true" data-tips-type="warning" data-tips-is-title="true">Warning</div>


<div data-tips="true" data-tips-type="warning">A model resource generally corresponds to one preconfigured inference endpoint and multiple custom inference endpoints. Model ID is bound to the preconfigured inference endpoint. When a model ID is entered, video generation tasks initiated by calling this preconfigured inference endpoint will be returned.</div>



---



**filter.service_tier<mark><sup>new</sup></mark>** ** ** `string / null` `Default value: default`

Service tier used for task processing.


* `default`: Online inference mode.

* `flex`: Offline inference mode.


<span id="7mi8G8RI"></span>
## Response parameters

> See [Request parameters](https://docs.byteplus.com/en/docs/178/74174#RxN8G2nH)



---



**items ** `object[]`

List of found video generation tasks. The scope of returned video generation tasks is consistent with the permission scope of the API key you use, that is, video generation tasks initiated by inference endpoints that you have permission for under the corresponding project are returned.


Attributes


---



items.**id ** `string`

Video generation task ID.


---



items.**model** `string`

Model name and version used for this task in the format of `model name-version`.


---



items.**status** `string`

Task status and related information:


* `queued`: In queue.

* `running`: Task in progress.

* `cancelled`: Task cancelled (only tasks in the queued status can be cancelled).

* `succeeded`: Task succeeded.

* `failed`: Task failed.

* `expired`: Task timed out.



---



items.**error** `object / null`

Error message. Returns `null` if the task succeeds; returns error data if the task fails. For details of error messages, see [Error codes](https://docs.byteplus.com/en/docs/ModelArk/1299023).


Attributes


---



error.**code** `string`

Error code.


---



error.**message** `string`

Error message.



---



items.**created_at** `integer`

Unix timestamp (in seconds) of the task creation time.


---



items.**updated_at** `integer`

Unix timestamp (in seconds) of the last update time of the task's current status.


---



items.**content** `object`

This parameter is output when the video generation task is completed, including the download URL of the generated video.


Attributes


---



content.**video_url** `string`

URL of the generated video. To ensure information security, the generated video will be deleted after 24 hours, please save it to your own storage in time.


---



content.**last_frame_url ** `string`

URL of the last frame image of the video. It is valid for 24 hours. Please save it to your own storage in time.

Note: This parameter is returned when `"return_last_frame": true` is set when [creating a video generation task](https://docs.byteplus.com/en/docs/ModelArk/1520757).



---



items.**seed** `integer`

Seed integer value used for this request.


---



items.**resolution **  `string` 

Resolution of the generated video.


---



items.**ratio ** `string`

Aspect ratio of the generated video.


---



items.**duration** `integer` 

Duration of the generated video. Unit: second.

**Note: ** Either **duration** or **frames** will be returned. If frames is not specified when [creating a video generation task](https://docs.byteplus.com/en/docs/ModelArk/1520757), duration will be returned.


---



items.**frames** `integer`  

Frame count of the generated video.

Note: Either **duration** or **frames** will be returned. If frames is specified when [creating a video generation task](https://docs.byteplus.com/en/docs/ModelArk/1520757), frames will be returned.


---



items.**framespersecond**  `integer` 

Frame rate of the generated video.


---



items.**generate_audio** `boolean`

Controls whether the generated video includes sound synchronized with the footage. Only Seedance 2.0 series and Seedance 1.5 Pro will return this parameter.


* `true`: The video output by the model includes synchronized audio.

* `false`: The video output by the model is a silent video.



---



items.**safety_identifier<mark><sup>new</sup></mark>** `string`

Unique identifier of the end user. If this parameter is set when [creating a video generation task](https://docs.byteplus.com/en/docs/ModelArk/1520757), the interface will return this information as is.


---



items.**priority<mark><sup>new</sup></mark>** `integer` 

The execution priority of the current request.


---



items.**draft** `boolean`

Whether the generated video is a draft video. Only Seedance 1.5 Pro will return this parameter.


* `true`: Indicates the current output is a draft video.

* `false`: Indicates the current output is a normal video.



---



items.**draft_task_id ** `string`

Draft video task ID. This parameter is returned when a formal video is generated based on a draft video.


---



items.**service_tier ** `string`

Service tier actually used for task processing.


---



items.**execution_expires_after ** `integer`

Task timeout threshold. Unit: second.


---



items.**usage** `object`

Token usage of this request.


Attributes


---



usage.**completion_tokens** `integer`

Number of tokens consumed for the model to output the video, which can be used as the basis for billing reconciliation.

<div data-tips="true" data-tips-type="default" data-tips-is-title="true">Note</div>


<div data-tips="true" data-tips-type="default">Seedance 2.0 series models have a minimum token usage limit. If the actual token usage is less than the minimum token usage, this parameter will return the minimum token usage which is used for billing.</div>



---



usage.**total_tokens**`integer`

Total number of tokens consumed by this request. Video generation models do not count input tokens, so input tokens are 0, namely **total_tokens**=**completion_tokens**.




---



**total ** `integer`

Number of tasks that meet the filter conditions.

